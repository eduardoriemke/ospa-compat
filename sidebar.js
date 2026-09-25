// sidebar.js — componente único do menu lateral OSPA Compat
// Uso em qualquer página:
//   <div id="ospa-sidebar"></div>
//   <script src="sidebar.js"></script>
// A página define, antes do script (ou via atributos no body):
//   <body data-page="documentos" data-projeto="02139SJD">

// O logo vem do login.js, carregado em todas as páginas.

// Itens de navegação — mudar aqui reflete em TODAS as páginas que incluem este arquivo.
// "roles" controla quem vê o link (ajustaremos quando entrarmos em permissões).
const OSPA_NAV_ITEMS = [
  { key: 'inicio',     label: 'Página inicial', href: 'home.html',   icon: 'ti-home',       roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'relatorio',  label: 'Relatório',   href: 'projeto.html',    icon: 'ti-file-text',  roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'documentos', label: 'Documentos',  href: 'documentos.html', icon: 'ti-folder',      roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'analises',   label: 'Monitor de Conflitos', href: 'analytics.html', icon: 'ti-chart-bar',   roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'divider' },
  { key: 'analise',    label: 'Análise',     href: 'analise.html',   icon: 'ti-list-check',  roles: ['coordenador','admin'], needsId: true },
  // Editor: continua sendo o "blob" independente que já existe hoje (gerado
  // via editor-launcher.js), sem sidebar, aberto em nova aba. Diferente dos
  // outros itens, não navega — dispara window.ospaOpenEditor() diretamente,
  // então a página precisa incluir <script src="editor-launcher.js"></script>.
  { key: 'editor',     label: 'Editor',      icon: 'ti-edit',        roles: ['coordenador','admin'], action: 'editor' },
  { key: 'configuracoes', label: 'Configurações', href: 'configuracoes.html', icon: 'ti-adjustments-horizontal', roles: ['coordenador','admin'], needsId: true },
];


// Ícone da seção ativa usa a variante preenchida do Tabler (sufixo
// "-filled"). Nem todo ícone tem essa variante — e quando não tem, o
// glifo simplesmente não existe e o ícone some da tela. Em vez de
// manter uma lista de exceções (que envelhece a cada atualização da
// biblioteca), medimos: um glifo inexistente tem largura diferente.
const _iconeCache = {};

function ospaTemPreenchido(nome) {
  if (nome in _iconeCache) return _iconeCache[nome];

  function largura(classe) {
    const s = document.createElement('i');
    s.className = 'ti ' + classe;
    s.style.cssText = 'position:absolute;visibility:hidden;font-size:32px';
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  }

  // Referência: uma classe que garantidamente não existe
  const inexistente = largura('ti-glifo-que-nao-existe-xyz');
  const candidato   = largura(nome);
  _iconeCache[nome] = Math.abs(candidato - inexistente) > 0.5;
  return _iconeCache[nome];
}

function ospaIcone(item, ativo) {
  if (!ativo) return item.icon;
  const preenchido = item.icon + '-filled';
  return ospaTemPreenchido(preenchido) ? preenchido : item.icon;
}

function ospaRenderSidebar() {
  const mount = document.getElementById('ospa-sidebar');
  if (!mount) return;
  mount.classList.add('sidebar'); // garante o layout correto (altura, sticky, rodapé) sem depender da página host

  const currentPage = document.body.dataset.page || '';
  const projeto = document.body.dataset.projeto || '—';
  const userName = document.body.dataset.userName || '';
  const userRole = document.body.dataset.userRole || 'projetista'; // vem da sessão, por enquanto placeholder
  const userDisciplinas = (document.body.dataset.userDisciplinas || '').split(',').filter(Boolean);
  const orgLine = userDisciplinas.length ? userDisciplinas.join(' · ') : 'OSPA';

  const iniciais = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  const navHtml = OSPA_NAV_ITEMS.map(item => {
    if (item.key === 'divider') return '<div class="nav-divider"></div>';
    if (!item.roles.includes(userRole)) return '';
    const active = item.key === currentPage ? ' active' : '';
    if (item.action) {
      return `<a href="#" class="nav-link${active}" data-action="${item.action}"><i class="ti ${ospaIcone(item, !!active)}" aria-hidden="true"></i>${item.label}</a>`;
    }
    const target = item.target ? ` target="${item.target}" rel="noopener"` : '';
    const queryParts = [];
    if (item.extraQuery) queryParts.push(item.extraQuery);
    if (item.needsId && projeto && projeto !== '—') queryParts.push('id=' + encodeURIComponent(projeto));
    const href = queryParts.length ? `${item.href}?${queryParts.join('&')}` : item.href;
    return `<a href="${href}" class="nav-link${active}"${target}><i class="ti ${ospaIcone(item, !!active)}" aria-hidden="true"></i>${item.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <div class="sidebar-logo">
      <canvas class="sidebar-ondas" aria-hidden="true"></canvas>
      <img src="${OSPA_LOGO}" alt="OSPA">
    </div>
    <div class="sidebar-body">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${iniciais}</div>
        <div>
          <div class="name">${userName}</div>
          <div class="org">${orgLine}</div>
        </div>
      </div>
      <a href="index.html" class="sidebar-project">
        <span>${projeto}</span>
        <span class="chev">⇅</span>
      </a>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <a href="#" class="nav-link" id="ospa-logout-link"><i class="ti ti-logout" aria-hidden="true"></i>Sair</a>
      </div>
    </div>
  `;

  // Contrato: cada página que inclui o sidebar define window.ospaLogout = suaFuncaoDeLogout
  const logoutLink = document.getElementById('ospa-logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      if (typeof window.ospaLogout === 'function') window.ospaLogout();
    });
  }

  // Editor: dispara window.ospaOpenEditor(projeto, papel) — função definida em
  // editor-launcher.js, incluído nas páginas que precisam do link Editor.
  // Trava o link enquanto a chamada está em andamento, pra clique repetido
  // (comum quando a geração do blob demora) não abrir várias janelas.
  const editorLink = mount.querySelector('[data-action="editor"]');
  if (editorLink) {
    editorLink.addEventListener('click', async e => {
      e.preventDefault();
      if (editorLink.dataset.loading === '1') return;
      if (typeof window.ospaOpenEditor !== 'function') {
        alert('Editor não disponível nesta página ainda.');
        console.error('ospaOpenEditor não está disponível — inclua editor-launcher.js nesta página.');
        return;
      }
      editorLink.dataset.loading = '1';
      const originalHtml = editorLink.innerHTML;
      editorLink.innerHTML = '<i class="ti ti-loader-2" aria-hidden="true"></i>Abrindo…';
      editorLink.style.pointerEvents = 'none';
      try {
        await window.ospaOpenEditor(projeto, userRole);
      } finally {
        editorLink.dataset.loading = '0';
        editorLink.innerHTML = originalHtml;
        editorLink.style.pointerEvents = '';
      }
    });
  }

  ospaIniciarOndas();   // o canvas é recriado a cada redesenho
  ospaIndicarNovos(projeto);
  ospaRegistrarAcesso(projeto);
}



/* ============================================================
   ONDAS DO TOPO
   Gotas nascem em pontos aleatórios e se expandem. Onde duas
   ondas se cruzam, o ponto de encontro é marcado — a mesma ideia
   de compatibilização de que o sistema trata.

   Cuidados por ser uma animação permanente:
   • usa a cor de acento do sistema (tokens.css), não uma cor fixa
   • pausa quando a aba não está visível
   • respeita a preferência de movimento reduzido do sistema
   • 30 quadros por segundo (metade do custo, diferença imperceptível)
   ============================================================ */

/* ============================================================
   NOVOS ARQUIVOS
   Um ponto no ícone de Documentos quando há arquivos postados
   depois da última vez que a notificação foi fechada.

   A marca fica no navegador: fechar a notificação na aba
   Documentos atualiza a marca e o ponto some. Como é local ao
   navegador, abrir em outro dispositivo pode mostrá-la de novo.
   ============================================================ */

function ospaChaveVisto(projeto) { return 'ospa_docs_visto_' + projeto; }

function ospaLerVisto(projeto) {
  try { return localStorage.getItem(ospaChaveVisto(projeto)); } catch (e) { return null; }
}

function ospaMarcarVisto(projeto) {
  try { localStorage.setItem(ospaChaveVisto(projeto), new Date().toISOString()); } catch (e) {}
  const ponto = document.querySelector('.nav-ponto');
  if (ponto) ponto.remove();
}

async function ospaIndicarNovos(projeto) {
  if (!projeto || typeof api !== 'function') return;

  let visto = ospaLerVisto(projeto);
  if (!visto) {
    // Primeira visita: nada é "novo" — evita marcar o acervo inteiro
    try { localStorage.setItem(ospaChaveVisto(projeto), new Date().toISOString()); } catch (e) {}
    return;
  }

  try {
    const novos = await api('GET', 'documentos_projeto', null,
      'projeto_id=eq.' + encodeURIComponent(projeto) +
      '&removido_em=is.null&data_upload=gt.' + encodeURIComponent(visto) +
      '&select=id&limit=100');
    if (!novos || !novos.length) return;

    const link = document.querySelector('.nav-link[href^="documentos.html"]');
    if (!link || link.querySelector('.nav-ponto')) return;
    const ponto = document.createElement('span');
    ponto.className = 'nav-ponto';
    ponto.title = novos.length >= 100 ? '100+ arquivos novos' : novos.length + ' arquivo(s) novo(s)';
    link.appendChild(ponto);
  } catch (e) {
    // sem conexão ou tabela indisponível: apenas não mostra o indicador
  }
}

/* ============================================================
   REGISTRO DE ACESSO
   Grava o último acesso de cada pessoa a cada tela do projeto.
   Só a coordenação terá acesso a essa informação (na futura seção
   de equipe das configurações do projeto).

   A sidebar é desenhada duas vezes: antes do login (sem sessão) e
   depois dele. Só a segunda registra, e uma única vez por página.
   ============================================================ */

let _acessoRegistrado = false;

function ospaRegistrarAcesso(projeto) {
  if (_acessoRegistrado) return;
  if (!projeto || typeof SESSION === 'undefined' || !SESSION) return;
  if (typeof sbFetch !== 'function') return;

  _acessoRegistrado = true;
  const pagina = (location.pathname.split('/').pop() || '').replace('.html', '') || 'inicio';

  // Silencioso: uma falha aqui nunca deve atrapalhar o uso da tela
  sbFetch('/rest/v1/rpc/registrar_acesso', {
    method: 'POST',
    body: JSON.stringify({ p_projeto: projeto, p_pagina: pagina })
  }).catch(() => {});
}

let _ondasAtivas = null;   // laço em execução, para encerrar o anterior

/* ------------------------------------------------------------
   Ondas concêntricas a partir de um ponto fixo, deformadas por
   obstáculos que derivam lentamente. A leitura é de respiração
   contínua, não de eventos isolados.

   Cuidados por ser uma animação permanente:
   • usa a cor de acento do sistema (tokens.css), bem esmaecida
   • pausa quando a aba não está visível
   • respeita a preferência de movimento reduzido do sistema
   • 30 quadros por segundo
   ------------------------------------------------------------ */

function ospaIniciarOndas() {
  // A sidebar é redesenhada depois do login, o que substitui o canvas.
  // Sem encerrar o laço antigo, ele seguiria desenhando num elemento
  // que já saiu da tela.
  if (_ondasAtivas) _ondasAtivas.parar();

  const cv = document.querySelector('.sidebar-ondas');
  if (!cv) return;

  const menosMovimento = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (menosMovimento) return;

  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let L = 0, A = 0, cx = 0, cy = 0, raioMax = 1;

  const acento = (getComputedStyle(document.documentElement)
                    .getPropertyValue('--acento-rgb') || '95, 118, 132').trim();

  const ONDAS = 7;          // anéis simultâneos
  const PONTOS = 46;        // pontos por anel — suficiente na escala da faixa
  const OBSTACULOS = 5;
  let obst = [];

  function medir() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    L = r.width; A = r.height;
    cv.width = L * dpr; cv.height = A * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Origem à esquerda, atrás do logo, para as ondas cruzarem a faixa
    cx = L * 0.18; cy = A * 0.5;
    raioMax = Math.hypot(L - cx, A) * 1.05;

    obst = [];
    for (let i = 0; i < OBSTACULOS; i++) {
      obst.push({
        x: L * (0.25 + Math.random() * 0.7),
        y: A * (0.15 + Math.random() * 0.7),
        r: 6 + Math.random() * 5,
        forca: 0.6 + Math.random() * 0.4,
        fase: Math.random() * Math.PI * 2
      });
    }
  }
  medir();
  window.addEventListener('resize', medir);

  let t = 0, rodando = true;
  const controle = { parar() { rodando = false; } };
  _ondasAtivas = controle;

  function quadro() {
    if (!rodando || _ondasAtivas !== controle) return;
    if (!cv.isConnected) { rodando = false; return; }
    if (!L) { medir(); }

    t += 0.02;
    ctx.clearRect(0, 0, L, A);

    for (let n = 0; n < ONDAS; n++) {
      // cada anel percorre 0→1 defasado dos demais
      const avanco = ((t * 0.10) + n / ONDAS) % 1;
      const raio = avanco * raioMax;
      if (raio < 2) continue;

      const opacidade = Math.max(0, 1 - avanco) * 0.078;
      if (opacidade <= 0.004) continue;

      ctx.beginPath();
      for (let i = 0; i <= PONTOS; i++) {
        const ang = (i / PONTOS) * Math.PI * 2;
        let x = cx + Math.cos(ang) * raio;
        let y = cy + Math.sin(ang) * raio;

        // obstáculos empurram levemente a frente de onda
        let desvio = 0;
        for (let o = 0; o < obst.length; o++) {
          const ob = obst[o];
          const ox = ob.x + Math.sin(t * 0.5 + ob.fase) * 6;
          const oy = ob.y + Math.cos(t * 0.5 + ob.fase) * 6;
          const dist = Math.hypot(x - ox, y - oy);
          const alcance = ob.r * 3.5;
          if (dist < alcance) {
            const inf = 1 - dist / alcance;
            desvio += Math.sin(t * 1.2 + dist * 0.35) * inf * ob.forca * 2.2;
          }
        }

        const dir = Math.atan2(y - cy, x - cx);
        x = cx + Math.cos(dir) * (raio + desvio);
        y = cy + Math.sin(dir) * (raio + desvio);

        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(' + acento + ',' + opacidade.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    setTimeout(() => requestAnimationFrame(quadro), 33);
  }

  document.addEventListener('visibilitychange', () => {
    if (_ondasAtivas !== controle) return;
    rodando = !document.hidden;
    if (rodando) quadro();
  });

  quadro();
}

document.addEventListener('DOMContentLoaded', ospaRenderSidebar);
