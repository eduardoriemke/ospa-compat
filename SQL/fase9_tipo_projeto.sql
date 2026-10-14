-- ============================================================
-- OSPA Compat — FASE 9: TIPO DE PROJETO
--
-- SUBSTITUI o fase9_papeis_tipo.sql. Rode ESTE arquivo, tenha ou
-- não rodado o outro: ele é idempotente e desfaz o que o anterior
-- tinha criado de papel novo. Se o outro nunca rodou, as linhas de
-- desfazer simplesmente não encontram nada e seguem adiante.
--
-- O QUE ENTRA
--
-- 1) TIPO DO PROJETO: "compatibilizacao" ou "acompanhamento"
--    Decide o que a interface mostra — um acompanhamento não tem a
--    parte de conflitos (Relatório, Documentos, Monitor, Análise,
--    Editor). É só apresentação e validação: mesmas tabelas,
--    mesmos campos, nenhum dado muda de lugar. Assim um projeto
--    troca de tipo depois sem migração nenhuma.
--
--    Todos os projetos existentes nascem "compatibilizacao" —
--    nada muda para Silva Jardim.
--
-- 2) eq_papel_valido(): a lista de papéis de projeto em um lugar
--    só, em vez de repetida em eq_adicionar e eq_papel.
--
-- O QUE NÃO ENTRA, E POR QUÊ
--
--    Chegou a ser desenhado um terceiro papel — "coordenador
--    externo", para quem coordenasse um projeto sem ser do
--    escritório, criando fichas sem entrar nas Configurações.
--    Descartado: dar ao projetista o poder de criar apontamentos
--    resolve o mesmo caso sem papel novo. Quem é de fora participa
--    como projetista; a coordenação é sempre da casa.
--
--    Por isso este arquivo também remove o que o anterior havia
--    criado para aquele papel (cfg_pode_coordenar e
--    cfg_exigir_coordenacao) e devolve painel_equipe à permissão
--    de sempre. Com dois papéis, "coordenar" e "configurar" são a
--    mesma coisa, e duas funções idênticas só confundem.
--
-- Reversão: fase9_reverter.sql
-- ============================================================

begin;

-- ── Desfaz o papel externo, se o arquivo anterior tiver rodado ──

-- Ninguém deveria estar com esse papel (ele nunca foi usado), mas se
-- estiver, volta a projetista: um papel que o sistema não reconhece
-- não recebe capacidade nenhuma, e a pessoa ficaria sem acesso a nada.
update projeto_usuarios_v2
   set papel = 'projetista'
 where papel = 'coordenador_externo';

-- ── A lista de papéis, num lugar só ──────────────────────────
-- Espelha OSPA_PAPEIS_EQUIPE, no sidebar.js. "admin" não entra:
-- é global, vem do cadastro de usuários, não do vínculo com o projeto.
create or replace function eq_papel_valido(p_papel text)
returns boolean language sql immutable as $$
  select p_papel in ('coordenador', 'projetista');
$$;

create or replace function eq_adicionar(p_projeto text, p_usuario uuid, p_papel text)
returns void language plpgsql as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  if not eq_papel_valido(p_papel) then
    raise exception 'Papel inválido.';
  end if;
  if not exists (select 1 from usuarios where id = p_usuario) then
    raise exception 'Usuário não encontrado. Contas são criadas na administração.';
  end if;
  if exists (select 1 from projeto_usuarios_v2 where projeto_id = p_projeto and usuario_id = p_usuario) then
    raise exception 'Essa pessoa já participa do projeto.';
  end if;
  insert into projeto_usuarios_v2 (projeto_id, usuario_id, papel, disciplinas)
  values (p_projeto, p_usuario, p_papel, '{}');
end $$;

create or replace function eq_papel(p_projeto text, p_usuario uuid, p_papel text)
returns void language plpgsql as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  if not eq_papel_valido(p_papel) then raise exception 'Papel inválido.'; end if;
  if p_papel <> 'coordenador' then perform eq_exigir_outro_coordenador(p_projeto, p_usuario); end if;
  update projeto_usuarios_v2 set papel = p_papel
   where projeto_id = p_projeto and usuario_id = p_usuario;
  if not found then raise exception 'Essa pessoa não participa do projeto.'; end if;
end $$;

-- eq_membros e painel_equipe voltam exatamente ao que eram na fase 3B/7
-- (a ordenação de três grupos e a permissão de "coordenação" existiam
-- só por causa do papel descartado).
create or replace function eq_membros(p_projeto text)
returns table(usuario_id uuid, nome text, email text, empresa text, papel text,
              disciplinas text[], ultimo_acesso timestamptz,
              ultima_resposta timestamptz, ultimo_comentario timestamptz)
language plpgsql stable as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  return query
    select u.id, u.nome::text, u.email::text, e.nome::text, pu.papel::text,
           coalesce(pu.disciplinas, '{}'),
           (select max(a.ultimo_acesso) from acessos a
             where a.usuario_id = u.id and a.projeto_id = p_projeto),
           (select max(s.updated_at) from disciplina_status s
             where s.usuario_id = u.id and s.projeto_id = p_projeto),
           (select max(c.created_at) from comentarios c
             where c.usuario_id = u.id and c.projeto_id = p_projeto)
    from projeto_usuarios_v2 pu
    join usuarios u on u.id = pu.usuario_id
    left join empresas e on e.id = u.empresa_id
    where pu.projeto_id = p_projeto
    order by (pu.papel <> 'coordenador'), u.nome;
end $$;

create or replace function painel_equipe(p_projeto text)
returns table(usuario_id uuid, nome text, empresa text, papel text,
              disciplinas text[], pendencias jsonb,
              devendo bigint, mais_antiga_dias int, ultimo_acesso timestamptz)
language plpgsql stable as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  return query
  with pend as (select * from painel_pendencias(p_projeto))
  select u.id, u.nome::text, e.nome::text, pu.papel::text,
         coalesce(pu.disciplinas, '{}'),
         coalesce((select jsonb_object_agg(p.disciplina, p.sem_resposta)
                     from pend p where p.disciplina = any(coalesce(pu.disciplinas, '{}'))), '{}'::jsonb),
         coalesce((select sum(p.sem_resposta)::bigint
                     from pend p where p.disciplina = any(coalesce(pu.disciplinas, '{}'))), 0),
         coalesce((select max(p.mais_antiga_dias)
                     from pend p where p.disciplina = any(coalesce(pu.disciplinas, '{}'))), 0),
         (select max(a.ultimo_acesso) from acessos a
           where a.usuario_id = u.id and a.projeto_id = p_projeto)
  from projeto_usuarios_v2 pu
  join usuarios u on u.id = pu.usuario_id
  left join empresas e on e.id = u.empresa_id
  where pu.projeto_id = p_projeto
  order by u.nome;
end $$;

drop function if exists cfg_exigir_coordenacao(text);
drop function if exists cfg_pode_coordenar(text);

-- ════════════════════ TIPO DO PROJETO ════════════════════════

alter table projetos
  add column if not exists tipo text not null default 'compatibilizacao';

-- Nome fixo na restrição para poder ser recriada sem duplicar
alter table projetos drop constraint if exists projetos_tipo_valido;
alter table projetos add constraint projetos_tipo_valido
  check (tipo in ('compatibilizacao', 'acompanhamento'));

-- Fica fora de proj_editar de propósito: mudar a assinatura daquela
-- função quebraria o salvamento de Dados gerais para quem estivesse
-- com a página antiga em cache.
create or replace function proj_tipo(p_projeto text, p_tipo text)
returns void language plpgsql as $$
begin
  perform cfg_exigir_permissao(p_projeto);
  if p_tipo not in ('compatibilizacao', 'acompanhamento') then
    raise exception 'Tipo inválido.';
  end if;
  update projetos set tipo = p_tipo where id = p_projeto;
  if not found then raise exception 'Projeto não encontrado.'; end if;
end $$;

-- ════════════════════ TESTES DE GUARDA ═══════════════════════
-- Falham a transação inteira se algo ficou pela metade.

do $$
begin
  if not eq_papel_valido('coordenador') or not eq_papel_valido('projetista') then
    raise exception 'eq_papel_valido deveria aceitar os dois papéis de projeto.';
  end if;
  if eq_papel_valido('coordenador_externo') then
    raise exception 'o papel externo foi descartado: eq_papel_valido não deve aceitá-lo.';
  end if;
  if eq_papel_valido('admin') then
    raise exception 'eq_papel_valido não deve aceitar admin: é papel global, não de projeto.';
  end if;
  if exists (select 1 from projeto_usuarios_v2 where papel not in ('coordenador','projetista')) then
    raise exception 'há vínculo com papel que o sistema não reconhece mais.';
  end if;
  if exists (select 1 from projetos where tipo is null) then
    raise exception 'projeto sem tipo.';
  end if;
end $$;

commit;
