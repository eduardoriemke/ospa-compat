-- ============================================================
-- OSPA Compat — FASE 14: EMPRESA INTERNA
--
-- Marca qual empresa é "da casa". Hoje a OSPA é uma empresa como
-- as outras no cadastro; com isto o sistema sabe quem é colaborador.
--
-- PRIMEIRO USO: na lista de projetos, colaborador da OSPA vê também
-- os projetos de que não participa — esmaecidos e sem clique, para
-- compor a página. Projetista de empresa externa continua vendo só
-- os seus: nome, foto e cliente de outros empreendimentos podem ser
-- confidenciais.
--
-- DEPOIS (a decidir): colaborador da OSPA abrir qualquer projeto em
-- modo leitura, editando só onde for coordenador.
--
-- Para desfazer:  alter table empresas drop column interna;
-- ============================================================

begin;

alter table empresas add column if not exists interna boolean not null default false;

update empresas set interna = true where lower(trim(nome)) = 'ospa';

commit;
