// sidebar.js — componente único do menu lateral OSPA Compat
// Uso em qualquer página:
//   <div id="ospa-sidebar"></div>
//   <script src="sidebar.js"></script>
// A página define, antes do script (ou via atributos no body):
//   <body data-page="documentos" data-projeto="02139SJD">

// O logo vem do login.js, carregado em todas as páginas.

/* ============================================================
   QUEM PODE O QUÊ

   Antes, cada tela perguntava "é coordenador ou admin?" com a
   condição escrita à mão — doze lugares, em seis páginas. Uma
   dessas doze ficou errada e o painel da equipe apareceu para um
   projetista; com a regra espalhada assim, o erro é questão de
   tempo, não de descuido.

   Agora a pergunta é outra. Em vez de "qual é o papel dele?", cada
   tela pergunta "ele pode moderar?", "ele pode configurar?". A
   resposta mora só aqui, nesta tabela, que dá para conferir de
   olho — e mudar o que um papel alcança é mexer em uma linha.

   As capacidades:
     configurar   Configurações do projeto — disciplinas, pavimentos,
                  equipe, dados gerais, Drive, backups
     fichas       abrir o Editor e criar/editar/publicar fichas
     moderar      resolver ficha, mexer no status das disciplinas,
                  editar e apagar comentário de outra pessoa
     ver_equipe   painel da equipe: último acesso, o que cada um deve
     analise      a página Análise
     ver_servidor "atualizado no servidor" — interno do escritório

   O papel vem do banco (projeto_usuarios_v2.papel) e é sempre por
   projeto; "admin" é global e tem tudo. Papel desconhecido não
   recebe nada: um valor estranho fecha a porta, não abre.

   São dois papéis de projeto, e é de propósito. Chegou-se a
   desenhar um terceiro — um coordenador de fora do escritório, que
   criaria fichas sem entrar nas Configurações — e ele foi
   descartado: dar ao projetista o poder de criar apontamentos
   resolve o mesmo caso sem papel novo. Quem é de fora participa
   como projetista; a coordenação é sempre da casa.
   ============================================================ */

const OSPA_CAPACIDADES = {
  admin:       ['configurar','fichas','moderar','ver_equipe','analise','ver_servidor'],
  coordenador: ['configurar','fichas','moderar','ver_equipe','analise','ver_servidor'],
  projetista:  []
};

const OSPA_PAPEL_ROTULO = {
  admin:       'Admin',
  coordenador: 'Coordenador',
  projetista:  'Projetista'
};

// Papéis que coordenam o projeto — para rótulo e ordenação, não para permissão.
const OSPA_PAPEIS_COORDENACAO = ['admin','coordenador'];

// Papéis que se pode atribuir a alguém dentro de um projeto, na ordem em que
// aparecem nos seletores das Configurações. "admin" não entra: é global, vem
// do cadastro de usuários, não do projeto. O banco confere a mesma lista.
const OSPA_PAPEIS_EQUIPE = ['projetista','coordenador'];

// O papel entra explícito, sempre: quem chama já tem o perfil em mão,
// e assim esta função não depende de nenhuma variável global que possa
// ter sobrado de outra sessão.
function ospaPode(papel, acao) {
  const lista = OSPA_CAPACIDADES[papel];
  return !!lista && lista.indexOf(acao) !== -1;
}

function ospaRotuloPapel(papel) {
  return OSPA_PAPEL_ROTULO[papel] || papel || '';
}

// Tipo do projeto: "compatibilizacao" (o padrão, tudo aparece) ou
// "acompanhamento" (sem a parte de conflitos). A página informa pelo
// body; na ausência, assume compatibilização — esconder aba é só
// apresentação, e cada tela continua conferindo permissão por si.
function ospaTipoProjeto() {
  return document.body.dataset.projetoTipo || 'compatibilizacao';
}

// Itens de navegação — mudar aqui reflete em TODAS as páginas que incluem este arquivo.
//   cap:   capacidade exigida (ausente = todo mundo do projeto vê)
//   tipos: tipos de projeto em que o item aparece (ausente = todos)
const OSPA_NAV_ITEMS = [
  { key: 'inicio',     label: 'Página inicial', href: 'home.html',   icon: 'ti-home',       needsId: true },
  { key: 'relatorio',  label: 'Relatório',   href: 'projeto.html',    icon: 'ti-file-text',  needsId: true, tipos: ['compatibilizacao'] },
  // Apontamentos vale nos dois tipos de projeto: é o caminho de baixo para
  // cima, que na compatibilização não existia — o que o projetista percebia
  // só chegava à coordenação por fora do sistema.
  { key: 'apontamentos', label: 'Apontamentos', href: 'apontamentos.html', icon: 'ti-message-2', needsId: true },
  { key: 'documentos', label: 'Documentos',  href: 'documentos.html', icon: 'ti-folder',      needsId: true, tipos: ['compatibilizacao'] },
  { key: 'analises',   label: 'Monitor de Conflitos', href: 'analytics.html', icon: 'ti-chart-bar',   needsId: true, tipos: ['compatibilizacao'] },
  { key: 'divider' },
  { key: 'analise',    label: 'Análise',     href: 'analise.html',   icon: 'ti-list-check',  needsId: true, cap: 'analise', tipos: ['compatibilizacao'] },
  // Editor: continua sendo o "blob" independente que já existe hoje (gerado
  // via editor-launcher.js), sem sidebar, aberto em nova aba. Diferente dos
  // outros itens, não navega — dispara window.ospaOpenEditor() diretamente,
  // então a página precisa incluir <script src="editor-launcher.js"></script>.
  { key: 'editor',     label: 'Editor',      icon: 'ti-edit',        action: 'editor', cap: 'fichas', tipos: ['compatibilizacao'] },
  { key: 'configuracoes', label: 'Configurações', href: 'configuracoes.html', icon: 'ti-adjustments-horizontal', needsId: true, cap: 'configurar' },
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

  const tipo = ospaTipoProjeto();

  const navHtml = OSPA_NAV_ITEMS.map(item => {
    if (item.key === 'divider') return 'divider';
    if (item.tipos && item.tipos.indexOf(tipo) === -1) return '';
    if (item.cap && !ospaPode(userRole, item.cap)) return '';
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
  })
  // Com itens escondidos (papel sem permissão, ou tipo de projeto sem a
  // parte de conflitos), o separador pode ficar sobrando no começo, no
  // fim ou grudado em outro. Só sobrevive o que separa dois grupos.
  .filter(Boolean)
  .filter((linha, i, lista) =>
    linha !== 'divider' ||
    (i > 0 && i < lista.length - 1 && lista[i - 1] !== 'divider'))
  .map(linha => linha === 'divider' ? '<div class="nav-divider"></div>' : linha)
  .join('');

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
        <a href="#" class="nav-link" id="ospa-senha-link"><i class="ti ti-key" aria-hidden="true"></i>Trocar senha</a>
        <a href="#" class="nav-link" id="ospa-logout-link"><i class="ti ti-logout" aria-hidden="true"></i>Sair</a>
      </div>
    </div>
  `;

  // Contrato: cada página que inclui o sidebar define window.ospaLogout = suaFuncaoDeLogout
  const linkSenha = document.getElementById('ospa-senha-link');
  if (linkSenha) linkSenha.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof ospaTrocarSenha === 'function') ospaTrocarSenha();
  });

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
  ospaIndicarApontamentos(projeto);
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
   APONTAMENTOS ESPERANDO ESTA PESSOA

   Um ponto no ícone de Apontamentos enquanto houver apontamento
   aberto dirigido a ela (ou à coordenação, se ela coordena) que
   ninguém respondeu ainda.

   Diferente do ponto de "arquivo novo", que é novidade e se apaga
   ao ver: este é pendência e some quando alguém responde. Um canal
   que ninguém olha apodrece — e aí ninguém mais confia nele.
   ============================================================ */

async function ospaIndicarApontamentos(projeto) {
  if (!projeto || typeof rpc !== 'function') return;
  try {
    const r = await rpc('ap_meu_resumo', { p_projeto: projeto });
    const n = r && r[0] ? Number(r[0].para_mim_sem_resposta || 0) : 0;
    if (!n) return;

    const link = document.querySelector('.nav-link[href^="apontamentos.html"]');
    if (!link || link.querySelector('.nav-ponto')) return;
    const ponto = document.createElement('span');
    ponto.className = 'nav-ponto';
    ponto.title = n === 1 ? '1 apontamento esperando você'
                          : n + ' apontamentos esperando você';
    link.appendChild(ponto);
  } catch (e) {
    // função ainda não aplicada no banco, ou sem conexão: só não mostra o ponto
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
  if (!ctx) return;   // sem contexto de desenho, a faixa fica lisa — e nada quebra
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
