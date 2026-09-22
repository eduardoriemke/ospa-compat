/* ============================================================
   OSPA Compat — disciplinas.js
   Cores das disciplinas, vindas do banco (tabela "disciplinas",
   editada na tela de Configurações do projeto).

   Antes, cada tela tinha sua própria cópia das cores, e o Monitor
   só conhecia 10 disciplinas — as demais recebiam uma cor sorteada.
   Agora a cor escolhida nas Configurações vale em todo lugar.

   As cores fixas que continuam no CSS de cada tela servem de
   RESERVA: se a consulta falhar, a tela mantém o visual de antes.
   As regras geradas aqui entram por último e têm prioridade.

   Carregar depois do auth.js:
     <script src="disciplinas.js?v=1"></script>
   ============================================================ */

window.OSPA_CORES = window.OSPA_CORES || {};   // sigla → { texto, fundo, borda }

// Só aceita siglas e cores em formato seguro: um valor estranho vindo
// do banco não pode quebrar (nem injetar) o CSS da página.
const _SIGLA_OK = /^[A-Za-z0-9_-]{1,12}$/;
const _COR_OK   = /^#[0-9A-Fa-f]{3,8}$/;

function _normalizarCores(lista) {
  const cores = {};
  (lista || []).forEach(function (d) {
    if (!d || !_SIGLA_OK.test(d.sigla || '')) return;
    if (!_COR_OK.test(d.cor_texto || '') || !_COR_OK.test(d.cor_fundo || '')) return;
    cores[d.sigla] = {
      texto: d.cor_texto,
      fundo: d.cor_fundo,
      borda: _COR_OK.test(d.cor_borda || '') ? d.cor_borda : d.cor_fundo
    };
  });
  return cores;
}

// Regras nos mesmos formatos já usados pelas telas:
//   .d-tag.d-XXX   → crachá da disciplina
//   .chip.on.d-XXX → chip de filtro selecionado
function ospaCssCores(cores) {
  let css = '';
  Object.keys(cores).forEach(function (s) {
    const c = cores[s];
    css += '.d-tag.d-' + s + '{background:' + c.fundo + ';color:' + c.texto + ';border-color:' + c.borda + '}\n';
    css += '.chip.on.d-' + s + '{border-color:' + c.texto + ';color:' + c.texto + ';background:' + c.fundo + '}\n';
  });
  return css;
}

// Gera o CSS direto de uma lista de linhas do banco (usado pelo editor)
function ospaCssDeLista(lista) {
  return ospaCssCores(_normalizarCores(lista));
}

function ospaAplicarCores(lista) {
  Object.assign(window.OSPA_CORES, _normalizarCores(lista));
  let el = document.getElementById('ospa-cores-disciplinas');
  if (!el) {
    el = document.createElement('style');
    el.id = 'ospa-cores-disciplinas';
    document.head.appendChild(el);   // por último: vence as regras de reserva
  }
  el.textContent = ospaCssCores(window.OSPA_CORES);
}

// Busca as cores do projeto (ou de todos, se projetoId for vazio — admin)
// e aplica na página. Nunca lança erro: se falhar, ficam as de reserva.
async function ospaCarregarCores(projetoId) {
  try {
    const qs = 'select=sigla,cor_texto,cor_fundo,cor_borda' +
               (projetoId ? '&projeto_id=eq.' + encodeURIComponent(projetoId) : '');
    const r = await sbFetch('/rest/v1/disciplinas?' + qs);
    if (!r.ok) return false;
    ospaAplicarCores(await r.json());
    return true;
  } catch (e) {
    return false;
  }
}
