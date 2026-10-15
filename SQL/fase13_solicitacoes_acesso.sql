-- ============================================================
-- OSPA Compat — FASE 13: SOLICITAÇÃO DE ACESSO
--
-- "Não tem acesso? Solicite." leva a acesso.html, um formulário
-- aberto (sem login), como o da Plataforma de briefing. O pedido
-- fica aqui; o admin vê na Administração → Solicitações e cria a
-- conta com o fluxo que já existe (usr_criar).
--
-- Sem e-mail por enquanto: nem para avisar o admin, nem para
-- responder a pessoa. Quando houver, entra num gatilho ou no Apps
-- Script, sem mudar esta tabela.
--
-- PERMISSÃO
--   A tabela é fechada. Quem não está logado só consegue chamar
--   acesso_solicitar; listar e resolver exigem admin.
--   A resposta ao pedido é sempre a mesma, tenha a pessoa conta ou
--   não — o formulário não serve para descobrir quem é usuário.
--
-- Para desfazer:
--   drop function acesso_solicitar(text,text,text,text);
--   drop function acesso_listar(); drop function acesso_resolver(bigint,text);
--   drop table solicitacoes_acesso;
-- ============================================================

begin;

create table if not exists solicitacoes_acesso (
  id            bigint generated always as identity primary key,
  email         text not null,
  nome          text not null,
  empresa       text,
  projeto       text not null,
  situacao      text not null default 'pendente'
                check (situacao in ('pendente', 'atendida', 'recusada')),
  criada_em     timestamptz not null default now(),
  resolvida_em  timestamptz,
  resolvida_por uuid references usuarios(id) on delete set null
);

-- Um pedido pendente por e-mail: pedir de novo atualiza o anterior.
create unique index if not exists solicitacoes_acesso_pendente
  on solicitacoes_acesso (lower(email)) where situacao = 'pendente';

alter table solicitacoes_acesso enable row level security;
revoke all on solicitacoes_acesso from anon, authenticated;


create or replace function acesso_solicitar(p_email text, p_nome text,
                                            p_empresa text, p_projeto text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email   text := lower(trim(coalesce(p_email, '')));
  v_nome    text := trim(coalesce(p_nome, ''));
  v_empresa text := nullif(trim(coalesce(p_empresa, '')), '');
  v_projeto text := trim(coalesce(p_projeto, ''));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 200 then
    raise exception 'Informe um e-mail válido.';
  end if;
  if length(v_nome) < 2 or length(v_nome) > 120 then
    raise exception 'Informe seu nome.';
  end if;
  if length(v_projeto) < 2 or length(v_projeto) > 200 then
    raise exception 'Informe de qual projeto você participa.';
  end if;
  if length(coalesce(v_empresa, '')) > 120 then
    raise exception 'O nome da empresa está longo demais.';
  end if;

  -- Trava contra robôs: o formulário é aberto a qualquer pessoa.
  if (select count(*) from solicitacoes_acesso where criada_em > now() - interval '1 hour') >= 30 then
    raise exception 'Muitos pedidos neste momento. Tente de novo mais tarde.';
  end if;

  insert into solicitacoes_acesso (email, nome, empresa, projeto)
  values (v_email, v_nome, v_empresa, v_projeto)
  on conflict (lower(email)) where situacao = 'pendente' do update
    set nome = excluded.nome, empresa = excluded.empresa,
        projeto = excluded.projeto, criada_em = now();
end $$;


create or replace function acesso_listar()
returns setof solicitacoes_acesso language plpgsql stable security definer set search_path = public as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores.'; end if;
  return query select * from solicitacoes_acesso where situacao = 'pendente' order by criada_em;
end $$;


create or replace function acesso_resolver(p_id bigint, p_situacao text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores.'; end if;
  if p_situacao not in ('atendida', 'recusada') then raise exception 'Situação inválida.'; end if;
  update solicitacoes_acesso
     set situacao = p_situacao, resolvida_em = now(), resolvida_por = auth.uid()
   where id = p_id and situacao = 'pendente';
end $$;


revoke all on function acesso_solicitar(text,text,text,text) from public;
revoke all on function acesso_listar() from public;
revoke all on function acesso_resolver(bigint,text) from public;
grant execute on function acesso_solicitar(text,text,text,text) to anon, authenticated;
grant execute on function acesso_listar() to authenticated;
grant execute on function acesso_resolver(bigint,text) to authenticated;

commit;
