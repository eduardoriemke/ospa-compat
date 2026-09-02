// editor-launcher.js — abre o Editor de Compatibilização
//
// O QUE MUDOU (antes: 10,6 MB · agora: ~4 KB)
// A versão anterior trazia o editor inteiro embutido em base64 dentro deste
// arquivo, e era carregada de imediato por cinco páginas — todo mundo baixava
// 10,6 MB, inclusive projetistas que nem têm acesso ao editor.
// Agora o editor mora em "editor-app.html", buscado somente quando alguém
// clica em "Editor". O arquivo fica em cache do navegador depois da 1ª vez.
//
// Uso (igual ao anterior):
//   <script src="editor-launcher.js"></script>
// O sidebar.js chama window.ospaOpenEditor(projetoId, papel).
// Requer a função global api(method, table, body, qs), presente em todas as páginas.

const EDITOR_APP_URL = 'editor-app.html?v=1';

// Guarda o HTML do editor após a primeira busca, para abrir instantaneamente
// nas vezes seguintes dentro da mesma página.
let _editorHTML = null;

async function _carregarEditorApp() {
  if (_editorHTML) return _editorHTML;
  const r = await fetch(EDITOR_APP_URL);
  if (!r.ok) throw new Error('Não foi possível carregar o editor (HTTP ' + r.status + ').');
  _editorHTML = await r.text();
  return _editorHTML;
}

async function ospaOpenEditor(id, papel) {
  if (papel !== "admin" && papel !== "coordenador") {
    alert("Você não tem permissão de edição neste projeto.");
    return;
  }
  try {
    // Busca o editor e os dados do projeto em paralelo
    const [modelo, proj, cfg, cfls, imgs] = await Promise.all([
      _carregarEditorApp(),
      api("GET","projetos",null,"id=eq."+id).then(function(r){return r[0];}),
      api("GET","config_projeto",null,"projeto_id=eq."+id).then(function(r){return r[0]||{};}),
      api("GET","conflitos",null,"projeto_id=eq."+id+"&order=ordem.asc,created_at.asc"),
      api("GET","imagens",null,"projeto_id=eq."+id+"&order=conflito_id.asc,ordem.asc&select=conflito_id,ordem,dados")
    ]);

    if (!proj) throw new Error('Projeto não encontrado.');

    // Imagens agrupadas pelo código do conflito
    var imagesDB = {};
    imgs.forEach(function(img){
      var c = cfls.find(function(x){ return x.id === img.conflito_id; });
      if (!c) return;
      if (!imagesDB[c.codigo]) imagesDB[c.codigo] = [];
      imagesDB[c.codigo][img.ordem] = img.dados;
    });
    Object.keys(imagesDB).forEach(function(k){ imagesDB[k] = imagesDB[k].filter(Boolean); });

    var cdata = cfls.map(function(c){
      return {id:c.codigo, _db:c.id, alert:c.alerta, status:c.status, loc:c.local,
              disc:c.disciplinas||[], desc:c.descricao||"", sol:c.proposta||null,
              obs:c.observacao||null, pub:c.publicado!==false};
    });

    // Injeta os dados nos marcadores do editor-app.html
    var html = modelo
      .replace('/*__IMAGES_DB__*/{}', JSON.stringify(imagesDB))
      .replace('/*__CONFLICTS__*/[]', JSON.stringify(cdata));

    // Metadados do projeto
    function esc(s){ return (s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\r/g,'').replace(/'/g,"\u0027"); }
    [["project", /project:\s*'[^']*'/, "project: '" + esc(proj.nome) + "'"],
     ["address", /address:\s*'[^']*'/, "address: '" + esc(proj.endereco||"") + "'"],
     ["client",  /client:\s*'[^']*'/,  "client:  '" + esc(proj.cliente||"") + "'"],
     ["manager", /manager:\s*'[^']*'/, "manager: '" + esc(proj.responsavel||"") + "'"],
     ["code",    /code:\s*'[^']*'/,    "code:    '" + proj.id + "'"],
     ["rev",     /rev:\s*'[^']*'/,     "rev:     '" + esc(proj.revisao||"REV. 00") + "'"],
     ["date",    /date:\s*'[^']*'/,    "date:    '" + esc(proj.data||"") + "'"]
    ].forEach(function(p){ html = html.replace(p[1], p[2]); });

    html = html.replace("notes:   /*__NOTES__*/''",
                        "notes:   /*__NOTES__*/'" + esc(proj.notas||"") + "'");

    // Disciplinas e locais vindos de config_projeto
    if (cfg.disciplinas && cfg.disciplinas.length) {
      html = html.replace(/disciplines:\s*\[[^\]]*\]/, 'disciplines: ' + JSON.stringify(cfg.disciplinas));
    }
    if (cfg.locais && cfg.locais.length) {
      html = html.replace(/locations:\s*\[[^\]]*\]/, 'locations: ' + JSON.stringify(cfg.locais));
    }

    var blob = new Blob([html], {type:"text/html; charset=utf-8"});
    var url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(function(){ URL.revokeObjectURL(url); }, 15000);

  } catch(e) {
    alert("Erro ao abrir o editor: " + e.message);
    console.error(e);
  }
}
