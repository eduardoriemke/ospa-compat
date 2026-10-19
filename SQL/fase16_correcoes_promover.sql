-- ============================================================
-- OSPA Compat — FASE 16: CORREÇÕES EM "VIRAR FICHA" E NA NUMERAÇÃO
--
-- Dois defeitos antigos (desde a fase 10), achados ao testar:
--
-- 1. CÓDIGO CORTADO A PARTIR DE 100
--    lpad(x, 2, '0') completa com zero à esquerda, mas também CORTA o
--    que passa de 2 caracteres: lpad('128', 2, '0') = '12'. Com 127
--    fichas no projeto, o "Virar ficha" tentava criar a C-12 (que já
--    existe) e falhava. O mesmo valeria para os apontamentos a partir
--    do A-100. Agora: no mínimo 2 dígitos, sem cortar.
--
-- 2. IMAGENS DO APONTAMENTO NA FICHA
--    O ap_promover gravava as imagens numa coluna "codigo" que a tabela
--    imagens não tem — a ficha liga as imagens por conflito_id. Todo
--    apontamento promovido COM imagem dava erro.
--
-- Pode rodar de novo sem problema (só substitui funções).
-- ============================================================

begin;

create or replace function ap_proximo_codigo(p_projeto text)
returns text language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  insert into apontamento_seq (projeto_id, ultimo)
  values (p_projeto, 1)
  on conflict (projeto_id) do update set ultimo = apontamento_seq.ultimo + 1
  returning ultimo into v_n;

  -- Projeto que já tinha apontamentos antes desta tabela existir:
  -- pula para depois do maior código em uso.
  if exists (select 1 from apontamentos a
             where a.projeto_id = p_projeto
               and substring(a.codigo from 'A-([0-9]+)')::int >= v_n) then
    select max(substring(a.codigo from 'A-([0-9]+)')::int) + 1 into v_n
      from apontamentos a where a.projeto_id = p_projeto;
    update apontamento_seq set ultimo = v_n where projeto_id = p_projeto;
  end if;

  -- Ao menos 2 dígitos, sem cortar: A-01 … A-99, A-100
  return 'A-' || lpad(v_n::text, greatest(2, length(v_n::text)), '0');
end $$;

create or replace function ap_promover(p_apontamento bigint, p_disciplinas text[], p_local text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  a          apontamentos;
  v_tipo     text;
  v_codigo   text;
  v_max      int;
  v_ficha    bigint;
  v_img      jsonb;
  v_i        int := 0;
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

  if p_disciplinas is null or array_length(p_disciplinas, 1) is null then
    p_disciplinas := a.destino_disciplinas;
  end if;
  select s into v_invalida from unnest(p_disciplinas) s
   where not exists (select 1 from disciplinas d
                      where d.projeto_id = a.projeto_id and d.sigla = s and d.ativa)
   limit 1;
  if v_invalida is not null then
    raise exception '% não é uma disciplina ativa deste projeto.', v_invalida;
  end if;

  -- Mesmo formato do editor (C-NN), com trava contra quem cria ficha ao mesmo tempo
  perform pg_advisory_xact_lock(hashtext('conflitos:' || a.projeto_id));
  select coalesce(max(substring(codigo from 'C-([0-9]+)')::int), 0) into v_max
    from conflitos where projeto_id = a.projeto_id;
  v_codigo := 'C-' || lpad((v_max + 1)::text, greatest(2, length((v_max + 1)::text)), '0');

  insert into conflitos (projeto_id, codigo, descricao, proposta, observacao,
                         local, disciplinas, status, alerta, publicado, ordem)
  values (a.projeto_id, v_codigo,
          a.titulo || case when a.descricao is null then '' else E'\n\n' || a.descricao end,
          '', 'Origem: apontamento ' || a.codigo || ' (' || a.autor_nome || ')',
          coalesce(nullif(trim(coalesce(p_local, '')), ''), a.local, ''),
          p_disciplinas, 'PENDENTE', a.critico, false,
          (select coalesce(max(ordem), 0) + 1 from conflitos where projeto_id = a.projeto_id))
  returning id into v_ficha;

  -- Imagens ligadas à ficha pelo id (conflito_id), na mesma ordem
  if a.imagens is not null then
    for v_img in select * from jsonb_array_elements(a.imagens) loop
      insert into imagens (projeto_id, conflito_id, dados, ordem)
      values (a.projeto_id, v_ficha, v_img #>> '{}', v_i);
      v_i := v_i + 1;
    end loop;
  end if;

  update apontamentos set ficha_id = v_ficha where id = p_apontamento;
  return v_ficha;
end $$;

revoke all on function ap_proximo_codigo(text) from public, anon;
revoke all on function ap_promover(bigint, text[], text) from public, anon;
grant execute on function ap_proximo_codigo(text) to authenticated;
grant execute on function ap_promover(bigint, text[], text) to authenticated;

commit;
