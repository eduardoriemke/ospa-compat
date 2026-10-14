-- ============================================================
-- OSPA Compat — FASE 9: REVERSÃO
--
-- Remove o tipo do projeto e a função de lista de papéis. Depois
-- deste arquivo, reaplique fase3b_equipe.sql para devolver
-- eq_adicionar e eq_papel às versões com a lista escrita dentro.
-- ============================================================

begin;

drop function if exists proj_tipo(text, text);
drop function if exists cfg_exigir_coordenacao(text);
drop function if exists cfg_pode_coordenar(text);

alter table projetos drop constraint if exists projetos_tipo_valido;
alter table projetos drop column if exists tipo;

commit;

-- eq_adicionar e eq_papel ainda chamam eq_papel_valido; só depois de
-- reaplicar a fase 3B é que essa função pode sair:
--   psql -f fase3b_equipe.sql
--   drop function if exists eq_papel_valido(text);
