-- ============================================================
-- OSPA Compat — FASE 11: IDIOMA POR PESSOA
--
-- O idioma é de quem usa, não do projeto: a mesma obra pode ter
-- um projetista que lê em inglês e outro em português, e cada um
-- vê o sistema na sua língua, sobre os mesmos dados.
--
-- O conteúdo não é traduzido — títulos de apontamento, descrições
-- de conflito, nomes de arquivo, comentários: tudo isso é escrito
-- por pessoas e fica como foi escrito. O que muda de idioma é a
-- interface.
--
-- Guardar no cadastro (e não só no navegador) serve para a pessoa
-- entrar de outro computador e encontrar o sistema como deixou.
-- ============================================================

begin;

alter table usuarios
  add column if not exists idioma text not null default 'pt';

alter table usuarios drop constraint if exists usuarios_idioma_valido;
alter table usuarios add constraint usuarios_idioma_valido
  check (idioma in ('pt', 'en'));

-- Trocar o próprio idioma não exige permissão nenhuma além de estar
-- logado: é preferência de quem usa, como a senha.
create or replace function usr_idioma(p_idioma text)
returns void language plpgsql as $$
begin
  if auth.uid() is null then
    raise exception 'Entre no sistema primeiro.';
  end if;
  if p_idioma not in ('pt', 'en') then
    raise exception 'Idioma inválido.';
  end if;
  update usuarios set idioma = p_idioma where id = auth.uid();
  if not found then raise exception 'Usuário não encontrado.'; end if;
end $$;

-- O admin pode definir o idioma de outra pessoa — útil ao criar a conta
-- de alguém de fora, para o primeiro acesso já vir na língua certa.
create or replace function usr_idioma_de(p_usuario uuid, p_idioma text)
returns void language plpgsql as $$
begin
  if not cfg_eh_admin() then
    raise exception 'Apenas administradores definem o idioma de outra pessoa.';
  end if;
  if p_idioma not in ('pt', 'en') then
    raise exception 'Idioma inválido.';
  end if;
  update usuarios set idioma = p_idioma where id = p_usuario;
  if not found then raise exception 'Usuário não encontrado.'; end if;
end $$;

commit;
