# OSPA Compat — estado do sistema

Documento vivo. Atualizar ao fim de cada etapa.

## O que é

Gestor de compatibilização de projetos. Páginas estáticas no GitHub Pages
consumindo Supabase (PostgREST). Sem framework, sem build: cada página é
um HTML com o script embutido, mais arquivos compartilhados.

- Repositório: `eduardoriemke/ospa-compat` (GitHub Pages)
- Banco: Supabase (`jxezjuovrxajjleyjdcs`)
- Projeto piloto: Silva Jardim / MARSALA — `02139SJD_COMPAT`

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Lista de projetos, backups, criar/excluir projeto |
| `home.html` | Página inicial do projeto — **somente leitura** |
| `projeto.html` | Relatório de conflitos (é o que o projetista usa) |
| `apontamentos.html` | Apontamentos — o caminho de baixo para cima |
| `documentos.html` | Documentos do Drive, gerador de nomenclatura, comparador |
| `analytics.html` | Monitor de conflitos |
| `analise.html` | Rodadas de compatibilização |
| `configuracoes.html` | Configurações do projeto (coordenação) |
| `admin.html` | Contas, empresas, consulta de vínculos, solicitações de acesso |
| `acesso.html` | Formulário aberto "Solicitar acesso" (link da tela de entrada) |
| `editor-app.html` | Editor de fichas (abre em aba própria) |
| `editor-launcher.js` | Busca o editor sob demanda e injeta os dados |
| `auth.js` | Sessão, `sbFetch`, renovação de token |
| `sidebar.js` / `sidebar.css` | Navegação, ondas do topo, registro de acesso |
| `disciplinas.js` | Cores das disciplinas, vindas do banco |
| `tokens.css` | Cor de acento do sistema (ardósia `#5F7684`) |
| `idioma.js` | Dicionário PT/EN e `t()`, `tn()`, `tQuando()`, `tData()` |
| `login.js` / `login.css` | Tela de entrada e o logo — compartilhados pelas 8 páginas |
| `dados.js` | Acesso ao banco: `api`, `apiTodos`, `rpc`, `setLoadingText` |
| `viewer-modelo.json` | Modelo do relatório exportado; buscado só na exportação |
| `controle_documentos.js` | Apps Script da varredura do Drive (vive na planilha, não no repositório) |

## Convenções

- **Toda operação que altera configuração passa por função no banco** (`cfg_*`,
  `eq_*`, `emp_*`, `disc_*`, `proj_*`), que confere a permissão no servidor.
  A tela nunca é a única proteção.
- **Permissão na tela se pergunta por capacidade, não por papel:**
  `ospaPode(papel, 'moderar')`, nunca `papel === 'coordenador'`. A tabela
  papel → capacidades mora só no `sidebar.js`. Papel desconhecido não recebe
  nada. (Antes eram doze condições escritas à mão em seis páginas; foi assim
  que o painel da equipe acabou visível para um projetista.)
- **O tipo do projeto só muda o que aparece**, nunca onde o dado mora — assim
  um projeto troca de tipo sem migração.
- **Desativar é o padrão; excluir só quando nada referencia.** Operações em
  cascata criam backup automático antes.
- **Espelhamento:** as operações de disciplinas e pavimentos atualizam também
  `config_projeto`, lido pelas telas antigas.
- **Documentos** leem a visão `v_documentos`, que resolve a disciplina pela
  associação de pastas — não pelo mapa fixo do Apps Script.
- Arquivos compartilhados são versionados na URL (`sidebar.js?v=5`). **Mudou o
  arquivo, sobe o número** — senão o navegador serve a cópia antiga.

## Etapas concluídas

1. **Fundação** — tabelas `disciplinas`, `pavimentos`, `empresas`, catálogo
2. **2A** — tela de Configurações: disciplinas e pavimentos, com operações protegidas
3. **2B-1** — cores das disciplinas vindas do banco, em todas as telas
4. **2B-2** — documentos seguem a associação de pastas (`v_documentos`)
5. **2B-3** — renomear disciplina em cascata (6 lugares guardam a sigla)
6. **3A** — empresas (cadastro global)
7. **3B** — aba Equipe; admin passa a só consultar vínculos
8. **3C** — empresa e responsáveis na tabela de disciplinas
9. **3D** — editar nome de usuário
10. **4A** — dados gerais nas Configurações; home vira leitura; editor deixa de configurar
11. **4B** — backups ganham aba no projeto; lista de projetos mostra só os de projetos excluídos
15. **8** — contas criadas pela plataforma: o admin informa nome e e-mail, o sistema
    cria a conta e mostra uma senha temporária uma única vez; redefinir senha de
    alguém e trocar a própria também saíram do painel do Supabase
14. **7** — painel na página inicial: o projetista vê o que deve responder e o que
    chegou nos últimos 7 dias; a coordenação vê a equipe com sinal de situação,
    pendências por disciplina, mais antiga e último acesso. Sem tabela nova.
13. **6** — Apps Script lê a configuração do banco: um script para todos os projetos,
    sem planilha; o mapa pasta → disciplina vem do cadastro; aba Drive nas Configurações,
    com "Atualizar agora" (pedido registrado, atendido pelo gatilho)
12. **5** — lista de projetos vira o nível global: usa a sessão do usuário (não mais a chave
    pública), criar/excluir projeto e backups de projetos excluídos exigem admin, e a
    Administração sai da barra lateral e passa a ser alcançada por ali
16. **9** — capacidades em vez de papéis nas telas; **tipo de projeto**
    (compatibilização / acompanhamento) decidindo quais abas aparecem
17. **10** — apontamentos: qualquer pessoa do projeto abre, dirigido à
    coordenação ou a uma disciplina, com imagem; conversa com resposta e
    imagem; a coordenação pode promover a ficha de conflito
18. **11** — bilíngue PT/EN: textos viram dados num dicionário de chaves,
    idioma por pessoa (`usuarios.idioma`), seletor no pé da barra lateral
19. **Identidade** (sem SQL) — logo só "OSPA"; tela de entrada única no estilo da
    Plataforma de briefing ("Plataforma de compatibilização"), botão do Google pronto
    mas escondido até o provedor ser ligado no Supabase
20. **12** — foto do projeto: tabela `projeto_fotos` (uma por projeto, imagem em texto,
    reduzida no navegador a 1600 px). Coordenação troca em Configurações → Dados gerais;
    aparece no cartão da lista e no alto da página inicial. Primeira tabela fechada de
    verdade: leitura para quem está logado, escrita só pela função `proj_foto`
21. **13** — solicitação de acesso: `acesso.html` (aberta, sem login) grava em
    `solicitacoes_acesso` pela função `acesso_solicitar`; o admin vê em
    Administração → Solicitações e cria a conta com o `usr_criar` de sempre.
    Sem e-mail ainda: nem aviso ao admin, nem resposta à pessoa
22. **14** — `empresas.interna` (a OSPA). Na lista de projetos, colaborador da OSPA
    vê também os projetos de que não participa, esmaecidos e sem clique; externo
    continua vendo só os seus (nome, foto e cliente podem ser confidenciais).
    A decidir: colaborador da OSPA abrir qualquer projeto em leitura, editando só
    onde for coordenador. Atenção: as tabelas antigas (`projetos` etc.) seguem
    abertas a qualquer logado — o sigilo real depende de fechá-las no banco
23. **Pendências em ZIP** (sem SQL) — no comparador de Documentos, "Baixar
    pendências (.zip)": lê os arquivos faltando/desatualizados da pasta do projeto
    no Google Drive para computador (G:, modo "Transmitir arquivos") e grava um ZIP
    com a estrutura de pastas do Drive + `_pendencias.csv`. Tudo no navegador
    (Chrome/Edge), gravando em disco aos poucos (`zip.js`, sem biblioteca, ZIP64).
    Substitui a tentativa pelo Apps Script, que falhava com arquivos grandes.
    Caminho no G: = pasta da disciplina (`disciplinas.pasta_nome`) / `caminho` /
    nome; se não achar, procura pelo nome. Pasta compartilhada por terceiros
    precisa de atalho no Meu Drive para aparecer no G:
24. **15** — apontamentos, segunda versão: vários destinatários (disciplinas,
    coordenação, todos), prazo, local (pavimento), crítico e histórico automático
    (gatilho → `apontamento_eventos`). Status segue único, agora com a cara da
    ficha (Pendente/Resolvido no canto). Imagens maiores. **Tabelas dos
    apontamentos fechadas**: até aqui estavam sem RLS e abertas até à chave
    pública; agora só as funções `ap_*` (security definer) acessam
25. **Colar e arrastar imagens** (sem SQL) — Ctrl+V e arrastar arquivo, além do
    botão de anexar, nos apontamentos (novo, edição, respostas), nos comentários
    do Relatório e nas fichas do Editor (vai para a ficha sob o mouse; arrastar a
    ficha continua reordenando). `imagens.js` no site; o Editor (blob) tem cópia
    própria. Mesma redução de sempre (1200 px, JPEG 0,75). Decidido não fazer
    marcação na imagem (o Lightshot já faz) nem pauta impressa (a reunião é no
    notebook, na própria tela)
26. **16** — correções: "Virar ficha" falhava em projeto com mais de 99 fichas
    (`lpad(x, 2)` corta: C-128 virava C-12) e com imagem (gravava numa coluna
    `codigo` que a tabela `imagens` não tem). Editor: imagens da ficha numa lista
    só — apagar uma imagem salva depois de já ter apagado outra não funcionava, e
    a imagem nova às vezes virava a principal; agora entra no fim e a principal
    só muda pela seta ↑

## Bilíngue (fase 11)

Os textos saíram do código e viraram DADOS, no `idioma.js`: ~140 chaves, cada
uma com a versão em cada idioma. Essa lista é um arquivo de dados comum, do
formato que qualquer framework consome — o trabalho de extrair não se perde na
migração; só a peça que lê a lista será trocada.

- `t('chave')` texto simples, com `%{nome}` interpolado; `tn('chave', n)`
  escolhe singular ou plural; `tQuando()` e `tData()` dão tempo relativo e data
  no idioma certo.
- Chave inexistente volta como a própria chave, **visível na tela** — erro de
  digitação aparece em vez de quebrar. Idioma sem tradução cai no português,
  então traduzir aos poucos é seguro.
- **Idioma é da pessoa, não do projeto** (`usuarios.idioma`, `usr_idioma()`):
  na mesma obra, um lê em inglês e outro em português, sobre os mesmos dados.
  Guardado no cadastro para acompanhar a pessoa em qualquer computador; o
  `localStorage` tem uma cópia só para a primeira pintura da tela.
- As telas chamam `ospaIdiomaDaSessao(me.idioma)` **antes** do primeiro render:
  a tela nasce no idioma certo, sem recarregar nem piscar em português. O
  seletor PT/EN (pé da barra) grava e recarrega — a página inteira volta no
  idioma novo, em vez de metade traduzida.
- **Traduzidos:** entrada, barra lateral, página inicial e apontamentos — o que
  alguém de fora do escritório enxerga. Configurações e Administração seguem em
  português de propósito: quem entra ali é a coordenação da casa.
- **O conteúdo não é traduzido** e não deve ser: títulos de apontamento,
  descrições de ficha, nomes de arquivo, comentários. Foi escrito por pessoas e
  fica como foi escrito.

## Apontamentos (fase 10)

> **Atualizado na fase 15** (`SQL/fase15_apontamentos_v2.sql`): o destino deixou
> de ser um só. Agora: `destino_disciplinas[]`, `destino_coordenacao`,
> `destino_todos` (toda a equipe, coordenação incluída), mais `prazo`, `local` e
> `critico`. Quem é destinatário: `ap_e_destinatario`. Destinatários, prazo,
> local e crítico mudam por `ap_ajustar` (autor ou coordenação). Cada mudança
> entra em `apontamento_eventos` por gatilho e aparece na conversa. As colunas
> antigas `destino_tipo`/`destino_disciplina` não são mais usadas (o `ap_listar`
> ainda as devolve, calculadas, para páginas antigas). O texto abaixo é o
> desenho original.

Duas tabelas (`apontamentos`, `apontamento_respostas`) e as funções `ap_*`.
Objeto diferente da ficha, de propósito: a ficha nasce da análise da
coordenação e desce para as disciplinas; o apontamento nasce de quem está
trabalhando e sobe. Na mesma tabela, a ficha ganharia campos que não usa e o
apontamento herdaria o status por disciplina, que não tem a quem perguntar.
Separados, o fluxo de compatibilização em produção não foi tocado.

- **Quem vê:** autor, destino (coordenação ou quem responde pela disciplina) e
  a coordenação, que vê tudo. Decidido no banco, em `ap_pode_ver` e dentro do
  `ap_listar` — a tela nunca recebe o que não deveria.
- **Quem fecha:** autor, destino ou coordenação (`ap_pode_resolver`).
- **Quem exclui:** o autor enquanto ninguém respondeu; depois, só a coordenação.
- **Editar** (autor ou coordenação): título, descrição e imagens — acrescentar e
  remover. O destino não muda; para trocá-lo, outro apontamento. No
  `ap_editar`, `p_imagens` null **não mexe** nas imagens e `[]` remove todas:
  se a tela errar e mandar vazio, o pior que acontece é nada. Imagens de um
  apontamento já promovido não acompanham a ficha — foram copiadas na promoção,
  e o modal avisa isso.
- **Numeração:** `A-01`, gerada no servidor por um contador guardado
  (`apontamento_seq`) que **não volta** — se fosse "maior + 1", apagar o A-02
  faria o próximo nascer A-02 e um código citado em reunião passaria a apontar
  para outra coisa.
- **Promover a ficha** (`ap_promover`, só coordenação): cria a ficha como
  rascunho não publicado, com o texto e as imagens, registra a origem na
  observação e guarda o vínculo em `apontamentos.ficha_id`. É o que faz a
  função valer também na compatibilização — antes, o que o projetista percebia
  só chegava por WhatsApp.
- **Aparece onde a pessoa já olha:** cartão no painel da página inicial e ponto
  no ícone da barra lateral. O ponto é **pendência**, não novidade: fica
  enquanto houver apontamento dirigido a ela sem nenhuma resposta, e não se
  apaga só por ter sido visto.
- **Imagens** em coluna `jsonb`, como `comentarios.imagens`: data URL de JPEG
  reduzido a 1200px pelo navegador. Mesma dívida de sempre — base64 dentro do
  banco, que já estourou um backup; tirar imagem do banco é uma migração só,
  que depois atende fichas, comentários e apontamentos juntos.

## Papéis e capacidades

| | configurar | fichas | moderar | ver equipe | análise | "no servidor" |
|---|---|---|---|---|---|---|
| admin (global) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| coordenador | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| projetista | — | — | — | — | — | — |

**Dois papéis de projeto, e é decisão, não falta de desenho.** Chegou a ser
desenhado e implementado um terceiro — "coordenador externo", que criaria
fichas sem entrar nas Configurações, para um arquiteto de fora do escritório —
e foi removido antes de entrar em uso: dar ao projetista o poder de criar
apontamentos resolve o mesmo caso sem papel novo. Quem é de fora participa como
projetista; a coordenação é sempre da casa. Se um dia a necessidade voltar
(alguém de fora que feche apontamentos de outros e acompanhe quem está
devendo), o papel volta mexendo na tabela de capacidades — era para isso que
ela serve.

Os direitos sobre um apontamento virão da **relação**, não do papel: autor
edita e fecha o seu, destinatário responde e marca como resolvido, coordenação
mexe em qualquer um. É o que permite o projetista participar sem papel novo.

## Tipo de projeto

`projetos.tipo`: `compatibilizacao` (padrão, tudo aparece) ou `acompanhamento`
(sem Relatório, Documentos, Monitor, Análise e Editor). Trocado na aba Dados
gerais, por `proj_tipo()`. A sidebar lê de `body.dataset.projetoTipo`, que cada
página preenche a partir da linha do projeto; na ausência assume
compatibilização — esconder aba é apresentação, e cada tela continua conferindo
permissão por si.

**Hoje um projeto de acompanhamento é quase vazio:** só Página inicial (e
Configurações, para a coordenação). Ele só fica útil com a página de
Apontamentos — próxima etapa.

## Como a varredura funciona hoje

Gatilho de tempo a cada 10 minutos em `atualizarBase` (implantação "Teste" —
o código salvo, não uma versão congelada). Ele só varre um projeto quando:
alguém pediu pela tela, o projeto nunca foi varrido, ou passou de 1 hora
(`INTERVALO_PADRAO_HORAS` no script). Fora isso, faz uma consulta e encerra.
Cada varredura do Silva Jardim leva ~2 minutos; a conta tem 6 h de cota
diária. Com vários projetos ativos, revisar esse intervalo.

## Próximas etapas

- **Fechar as tabelas antigas no banco** — `projetos`, `conflitos`, `imagens` e
  as demais têm política `acesso_total`: qualquer usuário logado lê e grava tudo
  direto pela API, sem passar pelas funções. A tela esconde, mas não protege.
  Fazer com cuidado (cada tela depende de alguma leitura direta) e testar bem.
- **Integrações com a TI** — domínio próprio (ex.: `compat.ospa.com.br`), repositório
  e Supabase numa conta/organização da OSPA, SMTP (recuperar senha) e projeto no
  Google Cloud (entrar com Google; download direto do Drive sem o G:).
- **Colaborador da OSPA abrir qualquer projeto** em leitura, editando só onde for
  coordenador (a marcação `empresas.interna` já existe). **Fazer junto com o
  "Entrar com Google"**: quem entrar com e-mail @ospa.com.br ganha conta
  automaticamente, sem o admin cadastrar um a um. Plano já levantado: papel novo
  "leitura" sem capacidades de edição (`OSPA_CAPACIDADES` no sidebar.js); as 9
  páginas que hoje barram quem não é da equipe passam a abrir em leitura para
  interno; esconder os botões de escrita que não dependem de capacidade
  (responder/comentar no Relatório; novo apontamento e responder nos
  Apontamentos); cartões esmaecidos da lista viram clicáveis; fase SQL abrindo
  as funções de leitura dos apontamentos (`ap_listar`, `ap_pode_ver`) a interno,
  mantendo as de escrita exigindo participar. A decidir: leitura vê como
  coordenador (painel da equipe, Análise, Monitor) ou como projetista.

- **Código da ficha no servidor** — o `C-NN` ainda é calculado no navegador, a
  partir da lista que aquele navegador carregou: duas pessoas criando ficha ao
  mesmo tempo geram o mesmo número, sem erro e sem aviso. A promoção de
  apontamento a ficha (`ap_promover`) já gera com trava no servidor; falta o
  editor. Vale junto da próxima mexida no editor.
- **Documentos no acompanhamento** — proposto: mostrar a aba quando o projeto
  tem pasta do Drive, em vez de depender do tipo. Em compatibilização nada
  muda; no acompanhamento aparece quando houver pasta. Sem disciplinas, a
  listagem cai toda como pasta avulsa. Aguardando decisão.
- **Traduzir o resto** — relatório, documentos, monitor, análise. Hoje quem
  está em inglês vê essas telas em português (no projeto de acompanhamento elas
  nem aparecem). O mecanismo está pronto: é acrescentar chaves ao `idioma.js` e
  trocar os textos por `t()`. Fazer quando houver projeto em inglês com
  compatibilização de verdade.
- **Avisos escritos com registro de leitura** — por ora, as notas do projeto fazem
  esse papel. Só implementar se a falta aparecer no uso.
- **Limpeza** — feita: login, logo e acesso ao banco unificados; modelo do relatório
  separado do editor (277 → 126 KB). As 8 páginas somam 304 KB (eram 389).

## Pendências conhecidas

- Mesclar disciplinas não foi implementado (não há duplicata real no projeto).
- Uma disciplina tem **uma pasta só** no Drive.
- Arquivos de gás moram na pasta do hidrossanitário e aparecem como HID.
- Backup não cobre `documentos_projeto`, `rodadas_compatibilizacao`,
  `rodada_disciplinas` nem vínculos de usuário.
- Só a recuperação de senha esquecida (sem estar logado) ainda depende de SMTP.
- `usr_criar` e `usr_redefinir_senha` escrevem nas tabelas internas de autenticação
  do Supabase. Se a estrutura mudar numa atualização, falham com erro claro; a saída
  temporária é criar pelo painel.
- RLS continua desligado em todas as tabelas.
- As telas nunca foram revisadas no celular.
- Comentários e respostas guardam o nome de quem escreveu na época; renomear
  um usuário não muda os registros antigos (decisão consciente).

## O que NÃO unificar

- `esc()` — o `analise.html` tem uma versão diferente, que escapa para texto de
  código, não para HTML.
- `show()` e `doLogout()` — dependem das telas e variáveis de cada página.
- As cores fixas de disciplina no CSS de cada tela são RESERVA: valem se a
  consulta ao banco falhar.

## Armadilhas já encontradas

- **Tabela nova nasce com RLS ligado** no Supabase: os registros entram e a
  leitura devolve vazio, sem erro. Conferir `relrowsecurity` ao criar tabela.
- **Nome da variável do projeto muda entre páginas**: `projId` no relatório e
  documentos, `PROJ_ID` na análise e monitor. Conferir antes de copiar trecho.
- **Verificação de sintaxe não pega variável inexistente.** Executar a página
  (navegador simulado) é o que pega.
- O limite de 1000 linhas por consulta do Supabase exige paginação (`apiTodos`).
- Dois arquivos compartilhados não podem declarar o mesmo nome: `const` repetido
  em scripts clássicos quebra a página inteira (aconteceu com o logo, em
  `sidebar.js` e `login.js`).
- **Trocar de usuário na mesma aba não recarrega a página**: as variáveis da
  sessão anterior continuam em memória. Todo dado sensível carregado por sessão
  precisa ser limpo no início do carregamento E na saída — foi assim que o painel
  da equipe apareceu para um projetista, mesmo com a consulta corretamente
  bloqueada no banco.
- Código copiado diverge sozinho: ao unificar o login havia 5 versões de
  `doLogin` e 6 de `api`, todas supostamente iguais.
- **Tela e banco têm que concordar sobre quem pode o quê.** No papel externo
  que acabou descartado, a tela liberava o painel da equipe e o banco recusava
  (`painel_equipe` exigia permissão de *configurar*) — e como a chamada tem
  `.catch(() => [])`, a tabela apareceria vazia, sem erro e sem explicação. Ao
  dar uma capacidade nova a um papel, conferir qual função do banco atende
  aquela tela.
- **Ideia nova pode dissolver um requisito já aprovado.** O papel externo foi
  pedido, desenhado e construído; a ideia dos apontamentos, que veio depois,
  tornou o papel desnecessário — e isso só apareceu quando o Eduardo perguntou.
  Quando o desenho muda no meio, revisitar o que já foi combinado antes de
  seguir implementando.
- Arquivo compartilhado com `</script>` dentro de um comentário não pode ser
  embutido num `<script>` para teste — encerra o bloco antes da hora. O
  navegador simulado busca os arquivos de um servidor local (`nav/abrir.js`).
- **`t` é o nome da função de tradução E o nome favorito de variável local**
  ao criar elementos (`const t = document.createElement(...)`). Dentro de uma
  função que declare isso, qualquer `t()` quebra com *"Cannot access 't' before
  initialization"* — e a tela para de desenhar no meio, sem erro visível para
  quem usa. Aconteceu na primeira tradução dos apontamentos. Se esse erro
  aparecer, procure a variável chamada `t`.
