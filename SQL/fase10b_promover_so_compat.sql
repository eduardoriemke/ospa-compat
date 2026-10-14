-- ============================================================
-- OSPA Compat — FASE 10B: PROMOVER SÓ ONDE EXISTE FICHA
--
-- Num projeto de acompanhamento não há relatório de conflitos,
-- nem Editor, nem disciplinas obrigatórias — então "virar ficha"
-- não tem para onde levar o apontamento. A tela já esconde o
-- botão; aqui o banco também recusa, para a regra não depender de
-- a tela estar certa.
--
-- Só esta função muda. Rode depois do fase10_apontamentos.sql.
-- ============================================================

begin;

create or replace function ap_promover(p_apontamento bigint, p_disciplinas text[], p_local text)
returns bigint language plpgsql as $$
declare
  a         apontamentos;
  v_tipo    text;
  v_codigo  text;
  v_max     int;
  v_ficha   bigint;
  v_img     jsonb;
  v_i       int := 0;
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

  -- Disciplinas da ficha: as informadas, ou a do destino quando houver
  if p_disciplinas is null or array_length(p_disciplinas, 1) is null then
    p_disciplinas := case when a.destino_disciplina is not null
                          then array[a.destino_disciplina] else '{}' end;
  end if;
  select s into v_invalida
    from unnest(p_disciplinas) s
   where not exists (select 1 from disciplinas d
                     where d.projeto_id = a.projeto_id and d.sigla = s and d.ativa)
   limit 1;
  if v_invalida is not null then
    raise exception '% não é uma disciplina ativa deste projeto.', v_invalida;
  end if;

  -- Código da ficha: mesmo formato do editor (C-NN), com trava para não
  -- colidir com quem estiver criando ficha pelo editor ao mesmo tempo.
  perform pg_advisory_xact_lock(hashtext('conflitos:' || a.projeto_id));
  select coalesce(max(substring(codigo from 'C-([0-9]+)')::int), 0) into v_max
    from conflitos where projeto_id = a.projeto_id;
  v_codigo := 'C-' || lpad((v_max + 1)::text, 2, '0');

  insert into conflitos (projeto_id, codigo, descricao, proposta, observacao,
                         local, disciplinas, status, alerta, publicado, ordem)
  values (a.projeto_id, v_codigo,
          a.titulo || case when a.descricao is null then '' else E'\n\n' || a.descricao end,
          '', 'Origem: apontamento ' || a.codigo || ' (' || a.autor_nome || ')',
          coalesce(nullif(trim(coalesce(p_local, '')), ''), ''),
          p_disciplinas, 'PENDENTE', false, false,
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

commit;
