-- ============================================================
-- OSPA Compat — FASE 17: DATA DE RESOLUÇÃO DAS FICHAS
--
-- O Monitor de Conflitos mostra quantas fichas estavam em aberto no
-- fim de cada mês. Sem saber QUANDO cada ficha foi resolvida, ele usava
-- a data da última alteração (updated_at): editar uma ficha resolvida
-- meses depois a fazia "voltar" a contar como aberta até aquela data.
--
-- Agora a ficha guarda resolvido_em, marcado por um gatilho:
--   • passou a RESOLVIDO        → resolvido_em = agora
--   • saiu de RESOLVIDO (reabriu) → resolvido_em = vazio
--   • continua como estava       → não mexe
-- Vale para qualquer caminho (Editor, Relatório, funções), porque é no banco.
--
-- PASSADO: as fichas que já estão resolvidas recebem o updated_at atual
-- (a mesma estimativa usada até aqui). Daqui para a frente, a data é exata.
--
-- Pode rodar de novo sem problema.
-- Para desfazer:
--   drop trigger if exists trg_conflitos_resolucao on conflitos;
--   drop function if exists conflitos_marcar_resolucao();
--   alter table conflitos drop column if exists resolvido_em;
-- ============================================================

begin;

alter table conflitos add column if not exists resolvido_em timestamptz;

-- Passado: estimativa pela última alteração (só onde ainda não há data)
update conflitos
   set resolvido_em = updated_at
 where status = 'RESOLVIDO' and resolvido_em is null;

create or replace function conflitos_marcar_resolucao()
returns trigger language plpgsql as $$
begin
  if new.status = 'RESOLVIDO' then
    if tg_op = 'INSERT' then
      -- inserção (ex.: restaurar um backup) pode já trazer a data
      new.resolvido_em := coalesce(new.resolvido_em, now());
    elsif old.status is distinct from 'RESOLVIDO' then
      new.resolvido_em := now();
    end if;
  else
    new.resolvido_em := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_conflitos_resolucao on conflitos;
create trigger trg_conflitos_resolucao
  before insert or update on conflitos
  for each row execute function conflitos_marcar_resolucao();

commit;
