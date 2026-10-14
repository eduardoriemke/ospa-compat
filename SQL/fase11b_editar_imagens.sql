-- ============================================================
-- OSPA Compat — FASE 11B: EDITAR AS IMAGENS DO APONTAMENTO
--
-- O ap_editar só mexia no texto. Quem anexasse o print errado
-- tinha duas saídas ruins: excluir o apontamento inteiro (e só
-- antes de alguém responder) ou mandar a imagem certa numa
-- resposta, deixando a errada no alto. Agora dá para acrescentar e
-- remover imagem.
--
-- COMO O PARÂMETRO SE COMPORTA
--   p_imagens = null   → não mexe nas imagens (é o que a versão
--                        antiga da função fazia, e é o que uma
--                        página em cache vai continuar mandando)
--   p_imagens = '[]'   → remove todas
--   p_imagens = [...]  → passa a ser exatamente essa lista
--
-- "null não mexe" em vez de "null apaga" é escolha de segurança:
-- se a tela errar e mandar vazio, o pior que acontece é nada.
--
-- A versão de três parâmetros continua existindo como atalho para
-- a de quatro — assim, durante os minutos em que alguém ainda
-- estiver com a página antiga no navegador, salvar o texto segue
-- funcionando em vez de dar erro.
--
-- ATENÇÃO: apontamento que já virou ficha teve as imagens COPIADAS
-- para a ficha. Mudar aqui depois não mexe na ficha — são duas
-- peças separadas desde a promoção, de propósito.
-- ============================================================

begin;

create or replace function ap_editar(p_apontamento bigint, p_titulo text,
                                     p_descricao text, p_imagens jsonb)
returns void language plpgsql as $$
declare
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_proj   text;
  v_autor  uuid;
begin
  select projeto_id, autor_id into v_proj, v_autor from apontamentos where id = p_apontamento;
  if v_proj is null then raise exception 'Apontamento não encontrado.'; end if;
  if v_autor <> auth.uid() and not cfg_pode_configurar(v_proj) then
    raise exception 'Só quem abriu o apontamento (ou a coordenação) pode editá-lo.';
  end if;
  if length(v_titulo) < 3 then raise exception 'Escreva um título com ao menos 3 letras.'; end if;

  update apontamentos set
    titulo    = v_titulo,
    descricao = nullif(trim(coalesce(p_descricao, '')), ''),
    imagens   = case
                  when p_imagens is null or p_imagens = 'null'::jsonb then imagens
                  when jsonb_array_length(p_imagens) = 0 then null
                  else p_imagens
                end
   where id = p_apontamento;
end $$;

-- Atalho para a assinatura antiga: mantém as imagens como estão.
create or replace function ap_editar(p_apontamento bigint, p_titulo text, p_descricao text)
returns void language plpgsql as $$
begin
  perform ap_editar(p_apontamento, p_titulo, p_descricao, null::jsonb);
end $$;

commit;
