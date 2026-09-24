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
12. **5** — lista de projetos vira o nível global: usa a sessão do usuário (não mais a chave
    pública), criar/excluir projeto e backups de projetos excluídos exigem admin, e a
    Administração sai da barra lateral e passa a ser alcançada por ali

## Próximas etapas

- **6** — Apps Script lê a configuração do banco (um script para todos os projetos)
- **Frente do projetista** — home como painel pessoal, avisos e indicadores
- **Limpeza** — unificar login e funções de acesso (hoje copiados em 8 páginas);
  separar o modelo de relatório do `editor-app.html` (278 KB)

## Pendências conhecidas

- Mesclar disciplinas não foi implementado (não há duplicata real no projeto).
- Uma disciplina tem **uma pasta só** no Drive.
- Arquivos de gás moram na pasta do hidrossanitário e aparecem como HID.
- Backup não cobre `documentos_projeto`, `rodadas_compatibilizacao`,
  `rodada_disciplinas` nem vínculos de usuário.
- Troca de senha e recuperação por e-mail dependem de SMTP (parado na TI).

## Armadilhas já encontradas

- **Tabela nova nasce com RLS ligado** no Supabase: os registros entram e a
  leitura devolve vazio, sem erro. Conferir `relrowsecurity` ao criar tabela.
- **Nome da variável do projeto muda entre páginas**: `projId` no relatório e
  documentos, `PROJ_ID` na análise e monitor. Conferir antes de copiar trecho.
- **Verificação de sintaxe não pega variável inexistente.** Executar a página
  (navegador simulado) é o que pega.
- O limite de 1000 linhas por consulta do Supabase exige paginação (`apiTodos`).
