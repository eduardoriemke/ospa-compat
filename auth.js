/* ============================================================
   OSPA Compat — auth.js
   Núcleo de sessão compartilhado por todas as páginas.

   Carregar SEMPRE antes do <script> da página:
     <script src="auth.js?v=1"></script>

   IMPORTANTE: as páginas NÃO devem declarar novamente nenhum
   dos nomes definidos aqui (SB_URL, SB_KEY, SB_AUTH, SESSION,
   SESSION_KEY, saveSession, loadSavedSession, clearSavedSession,
   refreshSession, tryRestoreSession, sbFetch). Declaração
   duplicada quebra o script inteiro da página.

   Continuam em cada página (variam conforme a tela):
     api(), doLogin(), doLogout(), showLoginErr()
   ============================================================ */

const SB_URL  = "https://jxezjuovrxajjleyjdcs.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZXpqdW92cnhhampsZXlqZGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDcwNTksImV4cCI6MjA5NjA4MzA1OX0.vaHfGesmDhZVeDMl_GSQYyIhN7E0EvRvV1vMy2vRYZY";
const SB_AUTH = SB_URL + "/auth/v1";

const SESSION_KEY = 'ospa_session';

// Estado da sessão ativa — compartilhado com o script da página.
let SESSION = null;


// ── ARMAZENAMENTO DA SESSÃO ──

function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch(e) {}
}

function loadSavedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch(e) { return null; }
}

function clearSavedSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
}


// ── RENOVAÇÃO ──

async function refreshSession(refreshToken) {
  const r = await fetch(SB_AUTH + '/token?grant_type=refresh_token', {
    method: 'POST',
    headers: {'Content-Type':'application/json','apikey':SB_KEY},
    body: JSON.stringify({refresh_token: refreshToken})
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.msg || 'Sessão expirada');
  return data;
}

async function tryRestoreSession() {
  const saved = loadSavedSession();
  if (!saved || !saved.refresh_token) return false;

  // Se o access_token salvo ainda vale por pelo menos mais 60s, reaproveita
  // direto — evita um round-trip de rede pro Supabase em toda troca de página.
  const agora = Math.floor(Date.now() / 1000);
  if (saved.access_token && saved.expires_at && saved.expires_at - agora > 60) {
    SESSION = saved;
    return true;
  }

  try {
    SESSION = await refreshSession(saved.refresh_token);
    saveSession(SESSION);
    return true;
  } catch(e) {
    clearSavedSession();
    return false;
  }
}


// ── CHAMADAS AUTENTICADAS ──

async function sbFetch(path, opts={}, _jaTentou) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SB_KEY,
    ...opts.headers
  };
  if (SESSION) headers['Authorization'] = 'Bearer ' + SESSION.access_token;
  const r = await fetch(SB_URL + path, {...opts, headers});

  // O access_token vale ~1h. Se a aba ficou ociosa e ele venceu, o Supabase
  // responde 401 — aqui renovamos a sessão silenciosamente e refazemos a
  // chamada uma única vez, sem o usuário perceber.
  if (r.status === 401 && !_jaTentou && SESSION) {
    const salvo = loadSavedSession();
    if (salvo && salvo.refresh_token) {
      try {
        SESSION = await refreshSession(salvo.refresh_token);
        saveSession(SESSION);
        return await sbFetch(path, opts, true);
      } catch (e) {
        clearSavedSession();
        alert('Sua sessão expirou. A página será recarregada para você entrar de novo.');
        location.reload();
      }
    }
  }
  return r;
}
