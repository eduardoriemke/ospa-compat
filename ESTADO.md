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
13. **6** — Apps Script lê a configuração do banco: um script para todos os projetos,
    sem planilha; o mapa pasta → disciplina vem do cadastro; aba Drive nas Configurações,
    com "Atualizar agora" (pedido registrado, atendido pelo gatilho)
12. **5** — lista de projetos vira o nível global: usa a sessão do usuário (não mais a chave
    pública), criar/excluir projeto e backups de projetos excluídos exigem admin, e a
    Administração sai da barra lateral e passa a ser alcançada por ali

## Como a varredura funciona hoje

Gatilho de tempo a cada 10 minutos em `atualizarBase` (implantação "Teste" —
o código salvo, não uma versão congelada). Ele só varre um projeto quando:
alguém pediu pela tela, o projeto nunca foi varrido, ou passou de 1 hora
(`INTERVALO_PADRAO_HORAS` no script). Fora isso, faz uma consulta e encerra.
Cada varredura do Silva Jardim leva ~2 minutos; a conta tem 6 h de cota
diária. Com vários projetos ativos, revisar esse intervalo.

## Próximas etapas

- **Frente do projetista** — home como painel pessoal: conflitos aguardando a pessoa,
  novidades desde a última visita, avisos da coordenação; e a visão inversa para
  quem coordena (quem está devendo resposta, há quanto tempo, por empresa).
  Depende da estrutura das fases 3 e 6, já pronta.
- **Limpeza** — feita: login, logo e acesso ao banco unificados; modelo do relatório
  separado do editor (277 → 126 KB). As 8 páginas somam 304 KB (eram 389).

## Pendências conhecidas

- Mesclar disciplinas não foi implementado (não há duplicata real no projeto).
- Uma disciplina tem **uma pasta só** no Drive.
- Arquivos de gás moram na pasta do hidrossanitário e aparecem como HID.
- Backup não cobre `documentos_projeto`, `rodadas_compatibilizacao`,
  `rodada_disciplinas` nem vínculos de usuário.
- Troca de senha e recuperação por e-mail dependem de SMTP (parado na TI).
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
- Código copiado diverge sozinho: ao unificar o login havia 5 versões de
  `doLogin` e 6 de `api`, todas supostamente iguais.
