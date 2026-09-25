/* ============================================================
   OSPA Compat — dados.js
   Acesso ao banco, num lugar só.

   Antes estas funções estavam copiadas nas páginas — e as cópias
   tinham divergido: seis versões da api(), duas da apiTodos().
   Algumas aceitavam cabeçalhos próprios, outras não; só uma
   tratava resposta vazia sem quebrar.

   Esta versão é o superconjunto: aceita tudo que qualquer página
   usava, e trata resposta vazia em todos os casos.

   Carregar depois do auth.js (usa o sbFetch, que leva a sessão):
     <script src="dados.js?v=1"></script>

   Fora daqui, de propósito:
   • esc()  — o analise.html tem uma versão diferente, que escapa
              para texto de código, não para HTML
   • show() e doLogout() — dependem das telas e das variáveis de
              cada página
   ============================================================ */

// Uma chamada ao banco. Devolve o conteúdo já convertido, ou null
// quando a resposta vem vazia (o que acontece em DELETE e em
// gravações com "return=minimal").
async function api(method, table, body, qs, customHeaders) {
  let r;
  try {
    r = await sbFetch('/rest/v1/' + table + (qs ? '?' + qs : ''), {
      method: method,
      headers: customHeaders || (method !== 'GET' ? { 'Prefer': 'return=representation' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    throw new Error('Falha de rede: ' + e.message);
  }

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'HTTP ' + r.status);
  }

  if (method === 'DELETE') return null;
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

// Busca TODAS as linhas de uma consulta, em páginas de 1000.
// O Supabase limita cada consulta a 1000 linhas; sem isto, o
// excedente simplesmente não chega — sem erro e sem aviso.
async function apiTodos(table, qs) {
  const PAGINA = 1000;
  let resultado = [], offset = 0;
  while (true) {
    const lote = await api('GET', table, null, qs + '&limit=' + PAGINA + '&offset=' + offset);
    if (!lote || !lote.length) break;
    resultado = resultado.concat(lote);
    if (lote.length < PAGINA) break;
    offset += PAGINA;
  }
  return resultado;
}

// Chamada a uma função do banco. Funções sem retorno devolvem
// corpo vazio, que não pode ser lido como JSON.
async function rpc(nome, args) {
  const r = await sbFetch('/rest/v1/rpc/' + nome, {
    method: 'POST',
    body: JSON.stringify(args || {})
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || 'HTTP ' + r.status);
  }
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

function setLoadingText(t) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = t;
}
