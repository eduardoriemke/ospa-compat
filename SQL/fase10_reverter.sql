-- ============================================================
-- OSPA Compat — FASE 10: REVERSÃO
--
-- ATENÇÃO: apaga os apontamentos e as respostas. Se já houver
-- conversa registrada, faça um backup antes — este arquivo não
-- faz backup por conta própria, de propósito: reverter uma fase é
-- coisa de quem acabou de aplicá-la e quer desfazer.
--
-- As fichas que tiverem sido promovidas a partir de apontamentos
-- NÃO são removidas: viraram conflito do projeto e ficam. Elas
-- apenas perdem o vínculo com a origem.
-- ============================================================

begin;

drop function if exists ap_meu_resumo(text);
drop function if exists ap_promover(bigint, text[], text);
drop function if exists ap_excluir(bigint);
drop function if exists ap_editar(bigint, text, text);
drop function if exists ap_resolver(bigint, boolean);
drop function if exists ap_responder(bigint, text, jsonb);
drop function if exists ap_respostas(bigint);
drop function if exists ap_listar(text);
drop function if exists ap_criar(text, text, text, text, text, jsonb);
drop function if exists ap_proximo_codigo(text);
drop function if exists ap_pode_resolver(bigint);
drop function if exists ap_exigir_participante(text);
drop function if exists ap_exigir_ver(bigint);
drop function if exists ap_pode_ver(bigint);

drop table if exists apontamento_respostas;
drop table if exists apontamento_seq;
drop table if exists apontamentos;

commit;
