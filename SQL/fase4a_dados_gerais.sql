-- ============================================================
-- OSPA Compat — FASE 4A: DADOS GERAIS DO PROJETO
--
-- Edição dos dados do projeto passa a ser uma operação com
-- permissão conferida no servidor, usada pela aba "Dados gerais"
-- das Configurações. A home deixa de editar; o editor também.
--
-- Revisão e data vêm junto: eram a última coisa que o editor
-- ainda configurava.
-- ============================================================

begin;

create or replace function proj_editar(
  p_projeto     text,
  p_nome        text,
  p_cliente     text,
  p_endereco    text,
  p_responsavel text,
  p_notas       text,
  p_revisao     text,
  p_data        text
) returns void language plpgsql as $$
declare v_nome text := trim(coalesce(p_nome, ''));
begin
  perform cfg_exigir_permissao(p_projeto);
  if length(v_nome) < 2 then
    raise exception 'O nome do projeto não pode ficar em branco.';
  end if;

  update projetos set
    nome        = v_nome,
    cliente     = nullif(trim(coalesce(p_cliente, '')), ''),
    endereco    = nullif(trim(coalesce(p_endereco, '')), ''),
    responsavel = nullif(trim(coalesce(p_responsavel, '')), ''),
    notas       = nullif(trim(coalesce(p_notas, '')), ''),
    revisao     = nullif(trim(coalesce(p_revisao, '')), ''),
    data        = nullif(trim(coalesce(p_data, '')), '')
  where id = p_projeto;

  if not found then raise exception 'Projeto não encontrado.'; end if;
end $$;

commit;
