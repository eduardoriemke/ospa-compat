-- ============================================================
-- OSPA Compat — FASE 5: NÍVEL GLOBAL
--
-- A lista de projetos passa a falar com o banco usando a SESSÃO do
-- usuário (antes usava a chave pública, como se ninguém estivesse
-- logado). Com isso, as operações globais podem ser protegidas de
-- verdade — e não só pela tela.
--
-- Criar e excluir projeto, e mexer em backups de projetos já
-- excluídos, passam a exigir administrador.
-- ============================================================

begin;

create or replace function proj_criar(
  p_id text, p_nome text, p_cliente text, p_responsavel text
) returns void language plpgsql as $$
declare v_id text := upper(trim(coalesce(p_id, '')));
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores criam projetos.'; end if;
  if v_id !~ '^[A-Z0-9_-]{3,40}$' then
    raise exception 'Código inválido: use de 3 a 40 letras, números, _ ou -.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 then raise exception 'Informe o nome do projeto.'; end if;
  if exists (select 1 from projetos where id = v_id) then
    raise exception 'Já existe um projeto com o código %.', v_id;
  end if;

  insert into projetos (id, nome, cliente, responsavel, revisao)
  values (v_id, trim(p_nome),
          nullif(trim(coalesce(p_cliente, '')), ''),
          nullif(trim(coalesce(p_responsavel, '')), ''),
          'REV. 00');
end $$;

-- Excluir faz backup antes: é a rede que permite recuperar depois
create or replace function proj_excluir(p_id text)
returns void language plpgsql as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores excluem projetos.'; end if;
  if not exists (select 1 from projetos where id = p_id) then
    raise exception 'Projeto não encontrado.';
  end if;
  perform backup_projeto(p_id, 'antes_exclusao', 'Backup automático antes da exclusão');
  delete from projetos where id = p_id;
end $$;

-- Backups de projetos que não existem mais: não há coordenador para
-- autorizar, então é assunto de administrador.
create or replace function bk_orfaos()
returns table(id integer, projeto_id text, tipo text, descricao text,
              created_at timestamptz, tamanho_mb numeric)
language plpgsql stable as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores veem backups de projetos excluídos.'; end if;
  return query
    select b.id, b.projeto_id::text, b.tipo::text, b.descricao::text, b.created_at,
           round((pg_column_size(b.dados) / 1048576.0)::numeric, 2)
    from backups b
    where not exists (select 1 from projetos p where p.id = b.projeto_id)
    order by b.created_at desc;
end $$;

create or replace function bk_orfao_restaurar(p_id integer)
returns text language plpgsql as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores restauram projetos excluídos.'; end if;
  if not exists (select 1 from backups where id = p_id) then raise exception 'Backup não encontrado.'; end if;
  return restaurar_backup(p_id);
end $$;

create or replace function bk_orfao_excluir(p_id integer)
returns void language plpgsql as $$
begin
  if not cfg_eh_admin() then raise exception 'Apenas administradores excluem backups de projetos excluídos.'; end if;
  delete from backups where id = p_id;
  if not found then raise exception 'Backup não encontrado.'; end if;
end $$;

commit;
