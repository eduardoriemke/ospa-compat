-- ============================================================
-- OSPA Compat — FASE 18: STATUS DA DISCIPLINA E FILA "PARA REVISAR"
--
-- 1. STATUS DA DISCIPLINA
--    Antes: Ciente / Em análise / Inviável — nenhum dizia "resolvi".
--    O "resolvido" ia para os comentários, e a coordenação tinha de
--    garimpar. Agora:
--      EM_ANALISE  estou ciente, ainda não resolvi (absorve o antigo CIENTE)
--      RESOLVIDO   fiz a minha parte (novo)
--      INVIAVEL    não dá como proposto (a tela exige um comentário)
--    Os CIENTE existentes viram EM_ANALISE. CIENTE continua aceito pelo
--    banco só para não quebrar uma página antiga aberta durante a troca —
--    o gatilho converte na hora.
--
-- 2. COMENTÁRIO COM MARCAÇÃO
--    comentarios.marcacao guarda o status que o comentário acompanha
--    (RESOLVIDO ou INVIAVEL): na conversa ele aparece com a etiqueta
--    "✓ HID marcou Resolvido".
--
-- 3. FILA "PARA REVISAR" (coordenação)
--    Ficha pendente em que, depois da última revisão da coordenação,
--    um projetista comentou ou marcou Resolvido/Inviável.
--    "Última revisão" = conflitos.revisado_em (novo), que só muda quando
--    status, crítico, texto, disciplinas ou local mudam — NÃO quando o
--    Editor regrava a ordem das fichas, o que mexe no updated_at de
--    todas — ou um comentário da coordenação.
--
-- 4. PENDÊNCIAS
--    Basta uma disciplina resolver: ficha com alguma disciplina em
--    RESOLVIDO está aguardando a coordenação validar, e deixa de contar
--    como "aguardando sua resposta" para as demais.
--
-- Pode rodar de novo sem problema.
-- ============================================================

begin;

-- ── 1. status da disciplina ──
update disciplina_status set status = 'EM_ANALISE' where status = 'CIENTE';

alter table disciplina_status drop constraint if exists disciplina_status_status_check;
alter table disciplina_status add constraint disciplina_status_status_check
  check (status = any (array['CIENTE','EM_ANALISE','RESOLVIDO','INVIAVEL']));

create or replace function disciplina_status_normalizar()
returns trigger language plpgsql as $$
begin
  if new.status = 'CIENTE' then new.status := 'EM_ANALISE'; end if;
  return new;
end $$;

drop trigger if exists trg_disciplina_status_normalizar on disciplina_status;
create trigger trg_disciplina_status_normalizar
  before insert or update on disciplina_status
  for each row execute function disciplina_status_normalizar();

-- ── 2. comentário com marcação ──
alter table comentarios add column if not exists marcacao text;
alter table comentarios drop constraint if exists comentarios_marcacao_check;
alter table comentarios add constraint comentarios_marcacao_check
  check (marcacao is null or marcacao in ('RESOLVIDO','INVIAVEL'));

-- ── 3. última revisão da coordenação ──
alter table conflitos add column if not exists revisado_em timestamptz;
update conflitos set revisado_em = updated_at where revisado_em is null;

create or replace function conflitos_marcar_revisao()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.revisado_em := coalesce(new.revisado_em, now());
  elsif new.status      is distinct from old.status
     or new.alerta      is distinct from old.alerta
     or new.descricao   is distinct from old.descricao
     or new.proposta    is distinct from old.proposta
     or new.observacao  is distinct from old.observacao
     or new.disciplinas is distinct from old.disciplinas
     or new.local       is distinct from old.local then
    new.revisado_em := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_conflitos_revisao on conflitos;
create trigger trg_conflitos_revisao
  before insert or update on conflitos
  for each row execute function conflitos_marcar_revisao();

-- Fichas para a coordenação revisar, com o motivo mais recente
create or replace function fichas_para_revisar(p_projeto text)
returns table(conflito_id integer, motivo text, quando timestamptz)
language plpgsql stable as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  return query
  with coord as (
    select u.id from usuarios u where u.papel_global = 'admin'
    union
    select pu.usuario_id from projeto_usuarios_v2 pu
     where pu.projeto_id = p_projeto and pu.papel = 'coordenador'
  ),
  fichas as (
    select c.id,
           greatest(coalesce(c.revisado_em, c.updated_at),
                    coalesce((select max(m.created_at) from comentarios m
                               where m.conflito_id = c.id and m.usuario_id in (select id from coord)),
                             '-infinity'::timestamptz)) as revisao
      from conflitos c
     where c.projeto_id = p_projeto
       and c.status is distinct from 'RESOLVIDO'
       and c.publicado is not false
  ),
  eventos as (
    select m.conflito_id, case when m.marcacao = 'RESOLVIDO' then 'resolvido'
                               when m.marcacao = 'INVIAVEL' then 'inviavel'
                               else 'comentario' end as motivo, m.created_at as quando
      from comentarios m
     where m.projeto_id = p_projeto and m.usuario_id not in (select id from coord)
    union all
    select s.conflito_id, lower(s.status), s.updated_at
      from disciplina_status s
     where s.projeto_id = p_projeto and s.status in ('RESOLVIDO','INVIAVEL')
  )
  select distinct on (f.id) f.id, e.motivo, e.quando
    from fichas f
    join eventos e on e.conflito_id = f.id and e.quando > f.revisao
   order by f.id, e.quando desc;
end $$;

grant execute on function fichas_para_revisar(text) to authenticated;

-- ── 4. pendências: ficha aguardando validação não pesa para as demais ──
create or replace function painel_pendencias(p_projeto text)
returns table(disciplina text, abertos bigint, sem_resposta bigint, criticos bigint, mais_antiga_dias integer)
language sql stable as $$
  with fichas as (
    select c.id, c.created_at, c.alerta, unnest(c.disciplinas) as disciplina
    from conflitos c
    where c.projeto_id = p_projeto
      and c.status is distinct from 'RESOLVIDO'
      and c.publicado is not false
      -- basta uma disciplina resolver: aguarda a coordenação, não as outras
      and not exists (select 1 from disciplina_status s
                       where s.conflito_id = c.id and s.status = 'RESOLVIDO')
  ),
  sem as (
    select f.*, not exists (
      select 1 from disciplina_status s
      where s.conflito_id = f.id and s.disciplina = f.disciplina
    ) as pendente
    from fichas f
  )
  select disciplina,
         count(*),
         count(*) filter (where pendente),
         count(*) filter (where alerta),
         coalesce(max(extract(day from now() - created_at)::int)
                  filter (where pendente), 0)
  from sem
  group by disciplina;
$$;

commit;
