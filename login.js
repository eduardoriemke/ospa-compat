/* ============================================================
   OSPA Compat — login.js
   Tela de entrada: marcação, logo e lógica, num lugar só.

   Antes isto estava copiado nas 8 páginas — e as cópias já tinham
   divergido: cinco versões de doLogin, cinco de setLogos. Mudanças
   de segurança precisavam ser repetidas oito vezes.

   Cada página declara só o lugar da tela (a tela é a mesma em todas):
     <div id="screen-login"></div>

   Depois de entrar, chama loadApp() da página (ou afterLogin(), que
   é como o index.html chama a sua).

   Carregar depois do auth.js:
     <link rel="stylesheet" href="login.css?v=1">
     <script src="login.js?v=1"></script>
   ============================================================ */

const OSPA_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIyIiBoZWlnaHQ9IjU4IiB2aWV3Qm94PSIwIDAgMTIyIDU4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkuOTUxOCAxMS41NjkzQzE5Ljk1MTggOC44NjE0NiAxNy43NTY2IDYuNjY2MzMgMTUuMDQ4OCA2LjY2NjMzSDExLjU2OTNDOC44NjE0NiA2LjY2NjMzIDYuNjY2MzMgOC44NjE0NiA2LjY2NjMzIDExLjU2OTNWNDYuNjgwOEM2LjY2NjMzIDQ5LjM4ODYgOC44NjE0NiA1MS41ODM3IDExLjU2OTMgNTEuNTgzN0gxNS4wNDg4QzE3Ljc1NjYgNTEuNTgzNyAxOS45NTE4IDQ5LjM4ODYgMTkuOTUxOCA0Ni42ODA4VjExLjU2OTNaTTI1Ljk2MTggNDYuNjgwOEMyNS45NjE4IDUyLjcwNzkgMjEuMDc1OSA1Ny41OTM4IDE1LjA0ODggNTcuNTkzOEgxMS41NjkzQzUuNTQyMTggNTcuNTkzOCAwLjY1NjI1IDUyLjcwNzkgMC42NTYyNSA0Ni42ODA4VjExLjU2OTNDMC42NTYyNSA1LjU0MjE4IDUuNTQyMTggMC42NTYyNSAxMS41NjkzIDAuNjU2MjVIMTUuMDQ4OEMyMS4wNzU5IDAuNjU2MjUgMjUuOTYxOCA1LjU0MjE4IDI1Ljk2MTggMTEuNTY5M1Y0Ni42ODA4WiIgZmlsbD0iIzE5MTkxOSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwOS45NDUgMC42NTYyNUMxMTUuOTcyIDAuNjU2MjUgMTIwLjg1OCA1LjU0MjE4IDEyMC44NTggMTEuNTY5M1Y1Ny4xMTkzQzEyMC44NTggNTcuMzgxNCAxMjAuNjQ2IDU3LjU5MzggMTIwLjM4NCA1Ny41OTM4SDExNS4zMjNDMTE1LjA2MSA1Ny41OTM4IDExNC44NDggNTcuMzgxNCAxMTQuODQ4IDU3LjExOTNWNDYuNjAxN0MxMTQuODQ4IDQ2LjQ3MDcgMTE0Ljc0MiA0Ni4zNjQ1IDExNC42MTEgNDYuMzY0NUgxMDEuOEMxMDEuNjY5IDQ2LjM2NDUgMTAxLjU2MyA0Ni40NzA3IDEwMS41NjMgNDYuNjAxN1Y1Ny4xMTkzQzEwMS41NjMgNTcuMzgxNCAxMDEuMzUgNTcuNTkzOCAxMDEuMDg4IDU3LjU5MzhIOTYuMDI3MkM5NS43NjUyIDU3LjU5MzggOTUuNTUyNyA1Ny4zODE0IDk1LjU1MjcgNTcuMTE5M1YxMS41NjkzQzk1LjU1MjcgNS41NDIxOCAxMDAuNDM5IDAuNjU2MjUgMTA2LjQ2NiAwLjY1NjI1SDEwOS45NDVaTTEwNi40NjYgNi42NjYzM0MxMDMuNzU4IDYuNjY2MzMgMTAxLjU2MyA4Ljg2MTQ2IDEwMS41NjMgMTEuNTY5M1Y0MC4xMTcyQzEwMS41NjMgNDAuMjQ4MiAxMDEuNjY5IDQwLjM1NDQgMTAxLjggNDAuMzU0NEgxMTQuNjExQzExNC43NDIgNDAuMzU0NCAxMTQuODQ4IDQwLjI0ODIgMTE0Ljg0OCA0MC4xMTcyVjExLjU2OTNDMTE0Ljg0OCA4Ljg2MTQ2IDExMi42NTMgNi42NjYzMyAxMDkuOTQ1IDYuNjY2MzNIMTA2LjQ2NloiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTU3LjU5NDcgNDYuNjgwOEM1Ny41OTQ3IDUyLjcwNzkgNTIuNzA4NyA1Ny41OTM4IDQ2LjY4MTYgNTcuNTkzOEg0My4yMDIxQzM3LjE3NSA1Ny41OTM4IDMyLjI4OTEgNTIuNzA3OSAzMi4yODkxIDQ2LjY4MDhWMzguNjE0NkMzMi4yODkxIDM4LjM1MjYgMzIuNTAxNSAzOC4xNDAyIDMyLjc2MzUgMzguMTQwMkgzNy44MjQ3QzM4LjA4NjcgMzguMTQwMiAzOC4yOTkxIDM4LjM1MjYgMzguMjk5MSAzOC42MTQ2VjQ2LjY4MDhDMzguMjk5MSA0OS4zODg2IDQwLjQ5NDMgNTEuNTgzNyA0My4yMDIxIDUxLjU4MzdINDYuNjgxNkM0OS4zODk0IDUxLjU4MzcgNTEuNTg0NiA0OS4zODg2IDUxLjU4NDYgNDYuNjgwOFYzNy4wMzNDNTEuNTg0NiAzNC4zNjc1IDQ5LjQ1NzYgMzIuMTk4OCA0Ni44MDgzIDMyLjEzMTZMNDMuMjAyMSAzMi4xMzAxQzM3LjI2OTIgMzIuMTMwMSAzMi40NDIyIDI3LjM5NTcgMzIuMjkyOCAyMS40OTg4TDMyLjI4OTEgMTEuNTY5M0MzMi4yODkxIDUuNTQyMTggMzcuMTc1IDAuNjU2MjUgNDMuMjAyMSAwLjY1NjI1SDQ2LjY4MTZDNTIuNzA4NyAwLjY1NjI1IDU3LjU5NDcgNS41NDIxOCA1Ny41OTQ3IDExLjU2OTNWMTkuNjM1NEM1Ny41OTQ3IDE5Ljg5NzUgNTcuMzgyMiAyMC4xMDk5IDU3LjEyMDIgMjAuMTA5OUg1Mi4wNTkxQzUxLjc5NyAyMC4xMDk5IDUxLjU4NDYgMTkuODk3NSA1MS41ODQ2IDE5LjYzNTRWMTEuNTY5M0M1MS41ODQ2IDguODYxNDYgNDkuMzg5NCA2LjY2NjMzIDQ2LjY4MTYgNi42NjYzM0g0My4yMDIxQzQwLjQ5NDMgNi42NjYzMyAzOC4yOTkxIDguODYxNDYgMzguMjk5MSAxMS41NjkzVjIxLjIxN0MzOC4yOTkxIDIzLjkyNDkgNDAuNDk0MyAyNi4xMiA0My4yMDIxIDI2LjEySDQ2LjY4MTZDNTIuNzA4NyAyNi4xMiA1Ny41OTQ3IDMxLjAwNTkgNTcuNTk0NyAzNy4wMzNWNDYuNjgwOFoiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04OS4yMjE4IDM1LjczMzJDODkuMDcyNCA0MS42MzAxIDg0LjI0NTQgNDYuMzY0NSA3OC4zMTI1IDQ2LjM2NDVINzAuMTY3MkM3MC4wMzYyIDQ2LjM2NDUgNjkuOTMgNDYuNDcwNyA2OS45MyA0Ni42MDE3VjU3LjExOTNDNjkuOTMgNTcuMzgxNCA2OS43MTc2IDU3LjU5MzggNjkuNDU1NSA1Ny41OTM4SDY0LjM5NDRDNjQuMTMyNCA1Ny41OTM4IDYzLjkxOTkgNTcuMzgxNCA2My45MTk5IDU3LjExOTNWMTEuNTY5M0M2My45MTk5IDUuNTQyMTggNjguODA1OSAwLjY1NjI1IDc0LjgzMyAwLjY1NjI1SDc4LjMxMjVDODQuMzM5NiAwLjY1NjI1MSA4OS4yMjU1IDUuNTQyMTggODkuMjI1NSAxMS41NjkzTDg5LjIyMTggMzUuNzMzMlpNODMuMjE1NCAxMS41NjkzQzgzLjIxNTQgOC44NjE0NiA4MS4wMjAzIDYuNjY2MzMgNzguMzEyNSA2LjY2NjMzSDc0LjgzM0M3Mi4xMjUxIDYuNjY2MzMgNjkuOTMgOC44NjE0NiA2OS45MyAxMS41NjkzVjQwLjExNzFDNjkuOTMgNDAuMjQ4MSA3MC4wMzYyIDQwLjM1NDQgNzAuMTY3MyA0MC4zNTQzTDc4LjQzOTEgNDAuMzUyOEM4MS4wODg0IDQwLjI4NTcgODMuMjE1NCAzOC4xMTY5IDgzLjIxNTQgMzUuNDUxNFYxMS41NjkzWiIgZmlsbD0iIzE5MTkxOSIvPgo8L3N2Zz4K";

// Coloca o logo em todo elemento que o espere — a lista é um
// superconjunto: cada página tem os seus, e os ausentes são ignorados.
function setLogos(src) {
  ['login-logo','loading-logo','denied-logo','app-logo','projects-logo'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.src = src || OSPA_LOGO;
  });
}

function showLoginErr(msg) {
  const el = document.getElementById('login-err');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function montarLogin() {
  const box = document.getElementById('screen-login');
  if (!box || box.dataset.pronto) return;

  // A mesma tela em todas as páginas (o data-titulo de cada uma não
  // aparece mais): a identidade é a da plataforma, igual à do briefing.
  const pedir = 'mailto:' + OSPA_PEDIR_ACESSO + '?subject=' + encodeURIComponent(t('login.pedir_assunto'));

  box.innerHTML =
    '<div class="login-fundo"></div>' +
    '<div class="login-wrap"><div class="login-box">' +
      '<img id="login-logo" class="login-logo" alt="OSPA">' +
      '<h1 class="login-title">' + t('login.plataforma') + '</h1>' +
      '<p class="login-sub">' + t('login.descricao') + '</p>' +
      // Só aparece quando o Google estiver ligado no Supabase (ver ospaGoogleLigado).
      '<div class="login-google" id="login-google" hidden>' +
        '<button type="button" class="login-btn-google" onclick="ospaEntrarGoogle()">' + GOOGLE_G + t('login.google') + '</button>' +
        '<div class="login-ou"><span>' + t('login.ou') + '</span></div>' +
      '</div>' +
      // onsubmit inline: garante que um erro de script NUNCA envie o
      // formulário pela URL, expondo email e senha no endereço.
      '<form id="login-form" autocomplete="on" onsubmit="return false" action="javascript:void(0)" method="post">' +
        '<label class="login-field"><span>' + t('login.email') + '</span>' +
          '<input type="email" id="login-email" name="email" placeholder="voce@empresa.com.br" autocomplete="username" spellcheck="false"></label>' +
        '<label class="login-field"><span>' + t('login.senha') + '</span>' +
          '<input type="password" id="login-password" name="password" placeholder="••••••" autocomplete="current-password"></label>' +
        '<div class="login-err" id="login-err"></div>' +
        '<button type="submit" class="login-btn" id="login-btn">' + t('login.entrar') + '</button>' +
      '</form>' +
      '<a class="login-pedir" href="' + pedir + '">' + t('login.pedir') + '</a>' +
    '</div></div>';

  box.dataset.pronto = '1';
  setLogos(OSPA_LOGO);

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    doLogin();
  });

  ospaGoogleLigado().then(function (ligado) {
    if (ligado) document.getElementById('login-google').hidden = false;
  });
}


/* ── ENTRAR COM GOOGLE ──
   O botão só aparece se o provedor Google estiver ativo no Supabase
   (GET /auth/v1/settings). Assim a tela já está pronta, e o botão surge
   sozinho no dia em que o Google for ligado — sem nova publicação. */

const OSPA_PEDIR_ACESSO = 'eduardo.riemke@ospa.com.br';

const GOOGLE_G = '<svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">' +
  '<path fill="#4285F4" d="M45 24c0-1.6-.15-3.15-.42-4.64H24v8.78h11.77c-.5 2.7-2.04 4.99-4.34 6.52v5.42h7.02C42.6 36.2 45 30.6 45 24z"/>' +
  '<path fill="#34A853" d="M24 46c5.94 0 10.93-1.97 14.57-5.33l-7.02-5.42c-1.95 1.31-4.45 2.08-7.55 2.08-5.8 0-10.72-3.9-12.47-9.16H4.3v5.7C7.95 41.06 15.4 46 24 46z"/>' +
  '<path fill="#FBBC05" d="M11.53 28.17A13.5 13.5 0 0 1 10.8 24c0-1.45.26-2.86.72-4.17v-5.7H4.3A21.9 21.9 0 0 0 2 24c0 3.55.85 6.9 2.3 9.87l7.23-5.7z"/>' +
  '<path fill="#EA4335" d="M24 10.75c3.27 0 6.2 1.13 8.51 3.33l6.22-6.22C34.92 4.35 29.94 2 24 2 15.4 2 7.95 6.94 4.3 14.13l7.23 5.7C13.28 14.65 18.2 10.75 24 10.75z"/>' +
  '</svg>';

async function ospaGoogleLigado() {
  try {
    const r = await fetch(SB_AUTH + '/settings', { headers: { apikey: SB_KEY } });
    const s = await r.json();
    return !!(s.external && s.external.google);
  } catch (e) { return false; }
}

// O retorno do Google (tokens no endereço) será tratado na etapa da
// integração; até lá o botão não aparece, porque o provedor está desligado.
function ospaEntrarGoogle() {
  location.href = SB_AUTH + '/authorize?provider=google&redirect_to=' +
    encodeURIComponent(location.href.split('#')[0]);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-err');
  err.style.display = 'none';

  if (!email || !pass) { showLoginErr(t('login.preencha')); return; }

  btn.disabled = true;
  btn.textContent = t('login.entrando');

  try {
    const r = await fetch(SB_AUTH + '/token?grant_type=password', {
      method: 'POST',
      headers: {'Content-Type':'application/json','apikey':SB_KEY},
      body: JSON.stringify({ email: email, password: pass })
    });
    const data = await r.json();
    // Senha errada vem em inglês do Supabase ("Invalid login credentials"): usa a nossa frase.
    if (!r.ok) throw new Error(data.error_code === 'invalid_credentials' ? t('login.invalido')
                               : (data.error_description || data.msg || t('login.invalido')));

    SESSION = data;
    saveSession(data);

    // Cada página tem seu ponto de entrada depois do login
    if (typeof loadApp === 'function') await loadApp();
    else if (typeof afterLogin === 'function') await afterLogin();
  } catch (e) {
    showLoginErr(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = t('login.entrar');
  }
}

document.addEventListener('DOMContentLoaded', montarLogin);
montarLogin();   // se o script já roda com a página montada, não espera


/* ── TROCAR A PRÓPRIA SENHA ──
   Usa o caminho oficial do Supabase (PUT /auth/v1/user), que exige
   estar logado e NÃO depende de envio de e-mail. É por isso que esta
   parte funciona mesmo com o SMTP ainda pendente.

   Recuperar senha esquecida, sem estar logado, é que precisa do e-mail. */

function ospaTrocarSenha() {
  if (typeof SESSION === 'undefined' || !SESSION) { alert(t('senha.entre_antes')); return; }

  const nova = prompt(t('senha.nova'));
  if (nova === null) return;
  if (!nova || nova.length < 8) { alert(t('senha.curta')); return; }
  const conf = prompt(t('senha.repita'));
  if (conf === null) return;
  if (conf !== nova) { alert(t('senha.difere')); return; }

  fetch(SB_AUTH + '/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SESSION.access_token
    },
    body: JSON.stringify({ password: nova })
  }).then(async function (r) {
    if (!r.ok) {
      const e = await r.json().catch(function(){ return {}; });
      throw new Error(e.msg || e.message || t('senha.falhou'));
    }
    alert(t('senha.trocada'));
  }).catch(function (e) { alert(e.message); });
}
