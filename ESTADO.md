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
| `admin.html` | Contas, empresas, consulta de vínculos |
| `editor-app.html` | Editor de fichas (abre em aba própria) |
| `editor-launcher.js` | Busca o editor sob demanda e injeta os dados |
| `auth.js` | Sessão, `sbFetch`, renovação de token |
| `sidebar.js` / `sidebar.css` | Navegação, ondas do topo, registro de acesso |
| `disciplinas.js` | Cores das disciplinas, vindas do banco |
| `tokens.css` | Cor de acento do sistema (ardósia `#5F7684`) |
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

## Apontamentos (fase 10)

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

- **Código da ficha no servidor** — o `C-NN` ainda é calculado no navegador, a
  partir da lista que aquele navegador carregou: duas pessoas criando ficha ao
  mesmo tempo geram o mesmo número, sem erro e sem aviso. A promoção de
  apontamento a ficha (`ap_promover`) já gera com trava no servidor; falta o
  editor. Vale junto da próxima mexida no editor.
- **Documentos no acompanhamento** — proposto: mostrar a aba quando o projeto
  tem pasta do Drive, em vez de depender do tipo. Em compatibilização nada
  muda; no acompanhamento aparece quando houver pasta. Sem disciplinas, a
  listagem cai toda como pasta avulsa. Aguardando decisão.
- **Bilíngue PT/EN** (decidido, não implementado) — há projeto real em inglês a
  caminho: coordenação do escritório, e um arquiteto americano participando
  como projetista, que levanta e responde apontamentos. O caro é
  extrair os ~700 textos de dentro do código para uma lista de chaves; essa
  lista é dado puro e serve a qualquer framework depois, então o trabalho não
  se perde na migração. Escopo menor primeiro: o que o projetista de fora
  enxerga (login, sidebar, página inicial, apontamentos) — Configurações e
  Administração podem seguir em português. A página de Apontamentos deve
  nascer já com o mecanismo de idioma, para não ser traduzida duas vezes.
  Vocabulário segue o **tipo** do projeto (conflito / apontamento), não cada
  projeto.
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
