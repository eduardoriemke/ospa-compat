-- ============================================================
-- OSPA Compat — FASE 15: APONTAMENTOS, SEGUNDA VERSÃO
--
-- O QUE MUDA
--   • Destinatários: várias disciplinas, a coordenação e/ou "todos"
--     (toda a equipe, coordenação incluída). Antes era um só:
--     coordenação OU uma disciplina.
--   • Prazo (data), local (pavimento) e crítico — como nas fichas.
--   • Histórico: um gatilho registra sozinho cada mudança de
--     destinatários, prazo, local, crítico, status, edição e promoção.
--   • Status continua ÚNICO (ABERTO / RESOLVIDO), agora mostrado como
--     nas fichas. Não virou status por disciplina: com "todos" não
--     haveria a quem perguntar, e o apontamento se resolve na conversa.
--
-- SEGURANÇA — TABELAS FECHADAS
--   Até aqui apontamentos, respostas e o contador estavam sem RLS e
--   com permissão total até para a chave pública: qualquer um com o
--   endereço do Supabase lia e gravava tudo, sem login. A regra de
--   "quem vê" só valia para quem usasse a tela.
--   Agora as tabelas ficam fechadas e TODAS as funções ap_* rodam
--   como dono (security definer): a única porta são elas, e elas
--   conferem quem é a pessoa (auth.uid()). Nenhuma tela lia as
--   tabelas direto — conferido antes de fechar.
--
-- QUEM VÊ / QUEM É DESTINATÁRIO
--   Vê:            o autor, a coordenação, e os destinatários.
--   Destinatário:  "todos" → qualquer participante do projeto;
--                  coordenação (ou "todos") → quem pode configurar;
--                  disciplina → quem responde por ela no projeto.
--   Fecha/reabre:  autor, destinatários ou coordenação.
--   Ajusta destinatários, prazo, local e crítico: autor ou coordenação.
--
-- COMPATIBILIDADE
--   As colunas antigas destino_tipo/destino_disciplina deixam de ser
--   usadas (ficam, sem obrigatoriedade, para uma limpeza futura). O
--   ap_listar continua devolvendo esses dois campos, calculados, e o
--   ap_criar de 6 parâmetros continua aceito — assim uma página antiga
--   ainda aberta no navegador de alguém não quebra durante a troca.
--
-- Pode rodar de novo sem problema (tudo é "se não existe" ou "substitui").
--
-- Para desfazer o fechamento (só se algo der muito errado):
--   alter table apontamentos disable row level security;
--   alter table apontamento_respostas disable row level security;
--   grant all on apontamentos, apontamento_respostas, apontamento_seq to authenticated;
-- ============================================================

begin;

-- ════════════════════ CAMPOS NOVOS ═══════════════════════════

alter table apontamentos
  add column if not exists destino_disciplinas text[]  not null default '{}',
  add column if not exists destino_coordenacao boolean not null default false,
  add column if not exists destino_todos       boolean not null default false,
  add column if not exists prazo               date,
  add column if not exists local               text,
  add column if not exists critico             boolean not null default false;

-- Converte o destino antigo (só nas linhas ainda não convertidas)
update apontamentos
   set destino_coordenacao = (destino_tipo = 'coordenacao'),
       destino_disciplinas = case when destino_disciplina is not null
                                  then array[destino_disciplina] else '{}' end
 where not destino_coordenacao and not destino_todos
   and cardinality(destino_disciplinas) = 0;

alter table apontamentos drop constraint if exists apontamentos_destino_valido;
alter table apontamentos alter column destino_tipo drop not null;
alter table apontamentos drop constraint if exists apontamentos_tem_destino;
alter table apontamentos add constraint apontamentos_tem_destino
  check (destino_todos or destino_coordenacao or cardinality(destino_disciplinas) > 0);

create index if not exists apontamentos_destinos on apontamentos using gin (destino_disciplinas);


-- ════════════════════ HISTÓRICO ═══════════════════════════════

create table if not exists apontamento_eventos (
  id             bigserial primary key,
  apontamento_id bigint not null references apontamentos(id) on delete cascade,
  usuario_id     uuid references usuarios(id) on delete set null,
  usuario_nome   text not null,
  tipo           text not null,   -- destinos | prazo | local | critico | resolvido | reaberto | editado | promovido
  detalhe        text,
  created_at     timestamptz not null default now()
);
create index if not exists apontamento_eventos_ap on apontamento_eventos (apontamento_id, created_at);

-- Gatilho: registra o que mudou, quem e quando. Roda como dono para
-- gravar na tabela fechada; o Postgres não exige permissão de execução
-- de quem dispara um gatilho, então ninguém consegue forjar eventos.
create or replace function ap_registrar_eventos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
begin
  if tg_op <> 'UPDATE' then return new; end if;
  select coalesce(nome, email) into v_nome from usuarios where id = auth.uid();
  v_nome := coalesce(v_nome, '(sistema)');

  if new.destino_disciplinas is distinct from old.destino_disciplinas
     or new.destino_coordenacao is distinct from old.destino_coordenacao
     or new.destino_todos is distinct from old.destino_todos then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo, detalhe)
    values (new.id, auth.uid(), v_nome, 'destinos',
            array_to_string(
              (case when new.destino_todos then array['TODOS'] else '{}' end)
              || (case when new.destino_coordenacao then array['COORDENACAO'] else '{}' end)
              || new.destino_disciplinas, ','));
  end if;
  if new.prazo is distinct from old.prazo then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo, detalhe)
    values (new.id, auth.uid(), v_nome, 'prazo', coalesce(new.prazo::text, ''));
  end if;
  if new.local is distinct from old.local then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo, detalhe)
    values (new.id, auth.uid(), v_nome, 'local', coalesce(new.local, ''));
  end if;
  if new.critico is distinct from old.critico then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo, detalhe)
    values (new.id, auth.uid(), v_nome, 'critico', case when new.critico then 'sim' else 'nao' end);
  end if;
  if new.status is distinct from old.status then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo)
    values (new.id, auth.uid(), v_nome, case when new.status = 'RESOLVIDO' then 'resolvido' else 'reaberto' end);
  end if;
  if new.titulo is distinct from old.titulo or new.descricao is distinct from old.descricao
     or new.imagens is distinct from old.imagens then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo)
    values (new.id, auth.uid(), v_nome, 'editado');
  end if;
  if new.ficha_id is distinct from old.ficha_id and new.ficha_id is not null then
    insert into apontamento_eventos (apontamento_id, usuario_id, usuario_nome, tipo, detalhe)
    values (new.id, auth.uid(), v_nome, 'promovido',
            (select codigo from conflitos where id = new.ficha_id));
  end if;
  return new;
end $$;

drop trigger if exists apontamentos_eventos on apontamentos;
create trigger apontamentos_eventos after update on apontamentos
  for each row execute function ap_registrar_eventos();


-- ════════════════════ QUEM É QUEM ═════════════════════════════

-- A pessoa logada é destinatária deste destino?
create or replace function ap_e_destinatario(p_projeto text, p_disciplinas text[],
                                             p_coordenacao boolean, p_todos boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select
    (p_todos and (
        exists (select 1 from usuarios u where u.id = auth.uid() and u.papel_global = 'admin')
     or exists (select 1 from projeto_usuarios_v2 pu
                 where pu.usuario_id = auth.uid() and pu.projeto_id = p_projeto)))
    or ((p_coordenacao or p_todos) and cfg_pode_configurar(p_projeto))
    or exists (select 1 from projeto_usuarios_v2 pu
                where pu.usuario_id = auth.uid() and pu.projeto_id = p_projeto
                  and coalesce(pu.disciplinas, '{}') && coalesce(p_disciplinas, '{}'));
$$;

create or replace function ap_pode_ver(p_apontamento bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from apontamentos a
     where a.id = p_apontamento
       and ( a.autor_id = auth.uid()
          or cfg_pode_configurar(a.projeto_id)
          or ap_e_destinatario(a.projeto_id, a.destino_disciplinas, a.destino_coordenacao, a.destino_todos)));
$$;

-- Fecha/reabre quem vê (autor, destinatários, coordenação)
create or replace function ap_pode_resolver(p_apontamento bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select ap_pode_ver(p_apontamento);
$$;

-- Destinatários válidos: ao menos um, e só disciplinas ativas do projeto
create or replace function ap_validar_destino(p_projeto text, p_disciplinas text[],
                                              p_coordenacao boolean, p_todos boolean)
returns void language plpgsql stable security definer set search_path = public as $$
declare v_invalida text;
begin
  if not coalesce(p_todos, false) and not coalesce(p_coordenacao, false)
     and coalesce(cardinality(p_disciplinas), 0) = 0 then
    raise exception 'Escolha ao menos um destinatário: uma disciplina, a coordenação ou todos.';
  end if;
  select s into v_invalida from unnest(coalesce(p_disciplinas, '{}')) s
   where not exists (select 1 from disciplinas d
                      where d.projeto_id = p_projeto and d.sigla = s and d.ativa)
   limit 1;
  if v_invalida is not null then
    raise exception '% não é uma disciplina ativa deste projeto.', v_invalida;
  end if;
end $$;

create or replace function ap_validar_local(p_projeto text, p_local text)
returns text language plpgsql stable security definer set search_path = public as $$
declare v text := nullif(trim(coalesce(p_local, '')), '');
begin
  if v is not null and not exists (select 1 from pavimentos p
                                    where p.projeto_id = p_projeto and p.sigla = v and p.ativo) then
    raise exception '% não é um pavimento ativo deste projeto.', v;
  end if;
  return v;
end $$;


-- ════════════════════ OPERAÇÕES ═══════════════════════════════

create or replace function ap_criar(p_projeto text, p_titulo text, p_descricao text,
                                    p_disciplinas text[], p_coordenacao boolean, p_todos boolean,
                                    p_imagens jsonb, p_prazo date, p_local text, p_critico boolean)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_nome   text;
  v_id     bigint;
  v_discs  text[] := coalesce((select array_agg(distinct s order by s) from unnest(coalesce(p_disciplinas, '{}')) s), '{}');
begin
  perform ap_exigir_participante(p_projeto);
  if length(v_titulo) < 3 then raise exception 'Escreva um título com ao menos 3 letras.'; end if;
  perform ap_validar_destino(p_projeto, v_discs, p_coordenacao, p_todos);

  select coalesce(nome, email) into v_nome from usuarios where id = auth.uid();

  insert into apontamentos (projeto_id, codigo, titulo, descricao, imagens, autor_id, autor_nome,
                            destino_disciplinas, destino_coordenacao, destino_todos,
                            prazo, local, critico)
  values (p_projeto, ap_proximo_codigo(p_projeto), v_titulo,
          nullif(trim(coalesce(p_descricao, '')), ''),
          case when p_imagens is null or p_imagens = 'null'::jsonb
                 or jsonb_array_length(coalesce(p_imagens, '[]'::jsonb)) = 0
               then null else p_imagens end,
          auth.uid(), coalesce(v_nome, '(sem nome)'),
          v_discs, coalesce(p_coordenacao, false), coalesce(p_todos, false),
          p_prazo, ap_validar_local(p_projeto, p_local), coalesce(p_critico, false))
  returning id into v_id;
  return v_id;
end $$;

-- Versão antiga (6 parâmetros), para páginas abertas antes da troca
create or replace function ap_criar(p_projeto text, p_titulo text, p_descricao text,
                                    p_destino_tipo text, p_destino_disciplina text, p_imagens jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
begin
  return ap_criar(p_projeto, p_titulo, p_descricao,
                  case when p_destino_tipo = 'disciplina' then array[p_destino_disciplina] else '{}' end,
                  p_destino_tipo = 'coordenacao', false, p_imagens, null, null, false);
end $$;

-- Destinatários, prazo, local e crítico: autor ou coordenação
create or replace function ap_ajustar(p_apontamento bigint, p_disciplinas text[], p_coordenacao boolean,
                                      p_todos boolean, p_prazo date, p_local text, p_critico boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_proj  text;
  v_autor uuid;
  v_discs text[] := coalesce((select array_agg(distinct s order by s) from unnest(coalesce(p_disciplinas, '{}')) s), '{}');
begin
  select projeto_id, autor_id into v_proj, v_autor from apontamentos where id = p_apontamento;
  if v_proj is null then raise exception 'Apontamento não encontrado.'; end if;
  if v_autor <> auth.uid() and not cfg_pode_configurar(v_proj) then
    raise exception 'Só quem abriu o apontamento (ou a coordenação) pode mudar destinatários, prazo, local e prioridade.';
  end if;
  perform ap_validar_destino(v_proj, v_discs, p_coordenacao, p_todos);
  update apontamentos set
    destino_disciplinas = v_discs,
    destino_coordenacao = coalesce(p_coordenacao, false),
    destino_todos       = coalesce(p_todos, false),
    prazo               = p_prazo,
    local               = ap_validar_local(v_proj, p_local),
    critico             = coalesce(p_critico, false)
   where id = p_apontamento;
end $$;

drop function if exists ap_listar(text);
create function ap_listar(p_projeto text)
returns table(id bigint, codigo text, titulo text, descricao text, imagens jsonb,
              autor_id uuid, autor_nome text, destino_tipo text, destino_disciplina text,
              status text, created_at timestamptz, resolvido_em timestamptz,
              ficha_id bigint, ficha_codigo text, respostas bigint, ultima_resposta timestamptz,
              sou_autor boolean, sou_destino boolean,
              destino_disciplinas text[], destino_coordenacao boolean, destino_todos boolean,
              prazo date, local text, critico boolean, pode_ajustar boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_coord boolean;
begin
  perform ap_exigir_participante(p_projeto);
  v_coord := cfg_pode_configurar(p_projeto);
  return query
    select a.id, a.codigo, a.titulo, a.descricao, a.imagens, a.autor_id, a.autor_nome,
           -- campos antigos, calculados (páginas antigas)
           case when not a.destino_todos and not a.destino_coordenacao
                     and cardinality(a.destino_disciplinas) = 1 then 'disciplina' else 'coordenacao' end,
           case when not a.destino_todos and not a.destino_coordenacao
                     and cardinality(a.destino_disciplinas) = 1 then a.destino_disciplinas[1] end,
           a.status, a.created_at, a.resolvido_em, a.ficha_id,
           (select c.codigo from conflitos c where c.id = a.ficha_id),
           (select count(*) from apontamento_respostas r where r.apontamento_id = a.id),
           (select max(r.created_at) from apontamento_respostas r where r.apontamento_id = a.id),
           a.autor_id = auth.uid(),
           ap_e_destinatario(a.projeto_id, a.destino_disciplinas, a.destino_coordenacao, a.destino_todos),
           a.destino_disciplinas, a.destino_coordenacao, a.destino_todos,
           a.prazo, a.local, a.critico,
           a.autor_id = auth.uid() or v_coord
      from apontamentos a
     where a.projeto_id = p_projeto
       and ( a.autor_id = auth.uid() or v_coord
          or ap_e_destinatario(a.projeto_id, a.destino_disciplinas, a.destino_coordenacao, a.destino_todos))
     order by (a.status = 'RESOLVIDO'), a.critico desc, a.created_at desc;
end $$;

drop function if exists ap_meu_resumo(text);
create function ap_meu_resumo(p_projeto text)
returns table(para_mim bigint, para_mim_sem_resposta bigint, meus_abertos bigint,
              recentes bigint, atrasados bigint)
language plpgsql stable security definer set search_path = public as $$
declare v_coord boolean;
begin
  perform ap_exigir_participante(p_projeto);
  v_coord := cfg_pode_configurar(p_projeto);
  return query
  with visiveis as (
    select a.*,
           ap_e_destinatario(a.projeto_id, a.destino_disciplinas, a.destino_coordenacao, a.destino_todos)
             and a.autor_id <> auth.uid() as e_para_mim,
           (select count(*) from apontamento_respostas r where r.apontamento_id = a.id) as n_resp
      from apontamentos a
     where a.projeto_id = p_projeto
       and ( a.autor_id = auth.uid() or v_coord
          or ap_e_destinatario(a.projeto_id, a.destino_disciplinas, a.destino_coordenacao, a.destino_todos))
  )
  select count(*) filter (where e_para_mim and status = 'ABERTO'),
         count(*) filter (where e_para_mim and status = 'ABERTO' and n_resp = 0),
         count(*) filter (where autor_id = auth.uid() and status = 'ABERTO'),
         count(*) filter (where created_at > now() - interval '7 days'),
         count(*) filter (where (e_para_mim or autor_id = auth.uid())
                            and status = 'ABERTO' and prazo < current_date)
    from visiveis;
end $$;

create or replace function ap_historico(p_apontamento bigint)
returns table(id bigint, usuario_nome text, tipo text, detalhe text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform ap_exigir_ver(p_apontamento);
  return query
    select e.id, e.usuario_nome, e.tipo, e.detalhe, e.created_at
      from apontamento_eventos e
     where e.apontamento_id = p_apontamento
     order by e.created_at;
end $$;

-- Promover: disciplinas, local e crítico do apontamento viram o padrão da ficha
create or replace function ap_promover(p_apontamento bigint, p_disciplinas text[], p_local text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  a          apontamentos;
  v_tipo     text;
  v_codigo   text;
  v_max      int;
  v_ficha    bigint;
  v_img      jsonb;
  v_i        int := 0;
  v_invalida text;
begin
  select * into a from apontamentos where id = p_apontamento;
  if a.id is null then raise exception 'Apontamento não encontrado.'; end if;
  perform cfg_exigir_permissao(a.projeto_id);
  if a.ficha_id is not null then
    raise exception 'Este apontamento já virou a ficha %.',
      (select codigo from conflitos c where c.id = a.ficha_id);
  end if;

  select tipo into v_tipo from projetos where id = a.projeto_id;
  if coalesce(v_tipo, 'compatibilizacao') <> 'compatibilizacao' then
    raise exception 'Este projeto é de acompanhamento: não há relatório de conflitos para a ficha.';
  end if;

  if p_disciplinas is null or array_length(p_disciplinas, 1) is null then
    p_disciplinas := a.destino_disciplinas;
  end if;
  select s into v_invalida from unnest(p_disciplinas) s
   where not exists (select 1 from disciplinas d
                      where d.projeto_id = a.projeto_id and d.sigla = s and d.ativa)
   limit 1;
  if v_invalida is not null then
    raise exception '% não é uma disciplina ativa deste projeto.', v_invalida;
  end if;

  perform pg_advisory_xact_lock(hashtext('conflitos:' || a.projeto_id));
  select coalesce(max(substring(codigo from 'C-([0-9]+)')::int), 0) into v_max
    from conflitos where projeto_id = a.projeto_id;
  v_codigo := 'C-' || lpad((v_max + 1)::text, 2, '0');

  insert into conflitos (projeto_id, codigo, descricao, proposta, observacao,
                         local, disciplinas, status, alerta, publicado, ordem)
  values (a.projeto_id, v_codigo,
          a.titulo || case when a.descricao is null then '' else E'\n\n' || a.descricao end,
          '', 'Origem: apontamento ' || a.codigo || ' (' || a.autor_nome || ')',
          coalesce(nullif(trim(coalesce(p_local, '')), ''), a.local, ''),
          p_disciplinas, 'PENDENTE', a.critico, false,
          (select coalesce(max(ordem), 0) + 1 from conflitos where projeto_id = a.projeto_id))
  returning id into v_ficha;

  if a.imagens is not null then
    for v_img in select * from jsonb_array_elements(a.imagens) loop
      insert into imagens (projeto_id, codigo, dados, ordem)
      values (a.projeto_id, v_codigo, trim(both '"' from v_img::text), v_i);
      v_i := v_i + 1;
    end loop;
  end if;

  update apontamentos set ficha_id = v_ficha where id = p_apontamento;
  return v_ficha;
end $$;

-- As demais passam a rodar como dono, com o mesmo corpo de antes
alter function ap_editar(bigint, text, text)            security definer set search_path = public;
alter function ap_editar(bigint, text, text, jsonb)     security definer set search_path = public;
alter function ap_excluir(bigint)                       security definer set search_path = public;
alter function ap_exigir_participante(text)             security definer set search_path = public;
alter function ap_exigir_ver(bigint)                    security definer set search_path = public;
alter function ap_proximo_codigo(text)                  security definer set search_path = public;
alter function ap_resolver(bigint, boolean)             security definer set search_path = public;
alter function ap_responder(bigint, text, jsonb)        security definer set search_path = public;
alter function ap_respostas(bigint)                     security definer set search_path = public;


-- ════════════════════ FECHAMENTO ══════════════════════════════

alter table apontamentos          enable row level security;
alter table apontamento_respostas enable row level security;
alter table apontamento_seq       enable row level security;
alter table apontamento_eventos   enable row level security;
revoke all on apontamentos, apontamento_respostas, apontamento_seq, apontamento_eventos from anon, authenticated;

-- Funções: só para quem está logado (a chave pública não chama nenhuma)
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as assinatura
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'ap\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.assinatura);
    execute format('grant execute on function %s to authenticated', f.assinatura);
  end loop;
end $$;

commit;
