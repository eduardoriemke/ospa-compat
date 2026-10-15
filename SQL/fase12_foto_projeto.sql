-- ============================================================
-- OSPA Compat — FASE 12: FOTO DO PROJETO
--
-- Uma foto por projeto, como na Plataforma de briefing: aparece no
-- cartão da lista de projetos e no alto da página inicial.
-- A coordenação troca a foto em Configurações → Dados gerais.
--
-- POR QUE UMA TABELA SEPARADA
--   A lista de projetos lê `projetos` inteira. Com a foto ali dentro,
--   toda tela que só precisa do nome baixaria a imagem junto.
--
-- POR QUE TEXTO NO BANCO (E NÃO O STORAGE DO SUPABASE)
--   É como o sistema já guarda as imagens das fichas e dos
--   apontamentos. O navegador reduz a foto antes de enviar (lado
--   maior 1600 px, JPEG), então cada uma fica em ~150–300 KB.
--   Se um dia o volume pedir, migra-se para o Storage sem mudar as telas
--   (elas só leem `dados`).
--
-- PERMISSÃO
--   Diferente das tabelas antigas (abertas a qualquer usuário logado),
--   esta só aceita escrita pela função proj_foto, que confere no
--   servidor se a pessoa pode configurar o projeto.
--
-- Para desfazer:  drop function proj_foto(text, text); drop table projeto_fotos;
-- ============================================================

begin;

create table if not exists projeto_fotos (
  projeto_id     text primary key references projetos(id) on delete cascade,
  dados          text not null,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid references usuarios(id) on delete set null
);

alter table projeto_fotos enable row level security;

drop policy if exists foto_leitura on projeto_fotos;
create policy foto_leitura on projeto_fotos for select to authenticated using (true);

revoke all on projeto_fotos from anon, authenticated;
grant select on projeto_fotos to authenticated;


-- p_dados = data URI da imagem (data:image/jpeg;base64,…) para definir;
-- null ou '' para remover a foto.
create or replace function proj_foto(p_projeto text, p_dados text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform cfg_exigir_permissao(p_projeto);

  if coalesce(p_dados, '') = '' then
    delete from projeto_fotos where projeto_id = p_projeto;
    return;
  end if;

  if p_dados !~ '^data:image/(jpeg|png|webp);base64,' then
    raise exception 'Formato de imagem não aceito. Use JPG, PNG ou WebP.';
  end if;
  -- ~1,5 MB em base64. A tela já reduz bem abaixo disso; é só uma trava.
  if length(p_dados) > 2000000 then
    raise exception 'Imagem grande demais. Tente uma foto menor.';
  end if;

  insert into projeto_fotos (projeto_id, dados, atualizado_em, atualizado_por)
  values (p_projeto, p_dados, now(), auth.uid())
  on conflict (projeto_id) do update
    set dados = excluded.dados, atualizado_em = now(), atualizado_por = auth.uid();
end $$;

revoke all on function proj_foto(text, text) from public, anon;
grant execute on function proj_foto(text, text) to authenticated;

commit;
