/* ============================================================
   OSPA Compat — imagens.js
   Colar (Ctrl+V) e arrastar imagens, além do botão de anexar.

   Feito para o fluxo do Lightshot / Ferramenta de Captura: capturar,
   marcar, copiar e colar direto no sistema — sem salvar arquivo.

   Cada lugar que recebe imagens vira uma "zona":
     ospaZonaDeImagens(elemento, files => { ... })
   e passa a aceitar:
     • arrastar arquivos de imagem para dentro do elemento;
     • colar com Ctrl+V. O colar vai para a zona onde está o foco
       (ex.: o campo de resposta); se o foco não estiver em nenhuma,
       vai para a última zona por onde o mouse passou.

   ospaReduzirImagem(file) faz a mesma redução dos anexos de sempre:
   lado maior até 1200 px, JPEG 0,75 — uma foto de celular não vira
   megabytes de base64 no banco.

   O Editor (editor-app.html) abre num blob e não carrega este arquivo:
   tem uma cópia própria, pequena, do mesmo comportamento.
   ============================================================ */

function ospaReduzirImagem(file, max, qualidade) {
  max = max || 1200; qualidade = qualidade || 0.75;
  return new Promise(function (ok, falha) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      let w = img.width, h = img.height;
      if (Math.max(w, h) > max) { const k = max / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);      // PNG transparente (prints) não vira preto
      g.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      ok(cv.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = function () { URL.revokeObjectURL(url); falha(new Error('Imagem ilegível')); };
    img.src = url;
  });
}

// Só os arquivos de imagem de um colar/arrastar
function ospaImagensDe(dados) {
  if (!dados) return [];
  const lista = [];
  if (dados.items && dados.items.length) {
    for (const it of dados.items) {
      if (it.kind === 'file' && it.type.indexOf('image/') === 0) { const f = it.getAsFile(); if (f) lista.push(f); }
    }
  }
  if (!lista.length && dados.files) {
    for (const f of dados.files) if (f.type.indexOf('image/') === 0) lista.push(f);
  }
  return lista;
}

function ospaTemArquivos(e) {
  return !!(e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1);
}

const _ospaZonas = [];          // { el, aoReceber }
let _ospaZonaAtiva = null;      // última zona onde o mouse passou ou o foco entrou

function ospaZonaDeImagens(el, aoReceber) {
  const zona = { el: el, aoReceber: aoReceber };
  _ospaZonas.push(zona);
  el.addEventListener('mouseenter', function () { _ospaZonaAtiva = zona; });
  el.addEventListener('focusin', function () { _ospaZonaAtiva = zona; });

  el.addEventListener('dragover', function (e) {
    if (!ospaTemArquivos(e)) return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    el.classList.add('ospa-soltar');
  });
  el.addEventListener('dragleave', function (e) {
    if (!el.contains(e.relatedTarget)) el.classList.remove('ospa-soltar');
  });
  el.addEventListener('drop', function (e) {
    el.classList.remove('ospa-soltar');
    if (!ospaTemArquivos(e)) return;
    e.preventDefault(); e.stopPropagation();
    const files = ospaImagensDe(e.dataTransfer);
    if (files.length) aoReceber(files);
  });
  return zona;
}

// Colar: a zona que contém o foco; senão, a última zona ativa ainda na tela
document.addEventListener('paste', function (e) {
  const files = ospaImagensDe(e.clipboardData);
  if (!files.length) return;                      // texto: segue o colar normal
  for (let i = _ospaZonas.length - 1; i >= 0; i--) {
    if (!_ospaZonas[i].el.isConnected) _ospaZonas.splice(i, 1);   // zona que saiu da tela
  }
  let zona = _ospaZonas.find(function (z) { return z.el.contains(e.target); });
  if (!zona && _ospaZonaAtiva && _ospaZonaAtiva.el.isConnected) zona = _ospaZonaAtiva;
  if (!zona) return;
  e.preventDefault();
  zona.aoReceber(files);
});

// Soltar um arquivo fora de uma zona não pode abrir a imagem no lugar da página
window.addEventListener('dragover', function (e) { if (ospaTemArquivos(e)) e.preventDefault(); });
window.addEventListener('drop', function (e) { if (ospaTemArquivos(e)) e.preventDefault(); });

// Destaque da zona enquanto se arrasta um arquivo por cima
(function () {
  const s = document.createElement('style');
  s.textContent = '.ospa-soltar{outline:2px dashed var(--text2,#727272)!important;outline-offset:3px;background-color:rgba(25,25,25,0.03)!important}';
  document.head.appendChild(s);
})();
