/* ============================================================
   OSPA Compat — idioma.js
   Textos do sistema em português e inglês, num lugar só.

   POR QUE ASSIM
   Os textos estavam escritos dentro do código, um por um, em nove
   páginas. Traduzir significaria tocar em centenas de lugares — e
   de novo a cada funcionalidade nova. Aqui eles viram DADOS: uma
   lista de chaves, cada uma com a versão em cada idioma. Essa
   lista é um arquivo de dados comum, do formato que qualquer
   framework consome na migração; o trabalho de extrair não se
   perde, só a peça que lê a lista é que será trocada.

   COMO USAR
     t('ap.novo')                        → "Novo apontamento"
     t('erro.x', {msg: e.message})        → interpola %{msg}
     tn('ap.respostas', 3)                → "3 respostas" (plural)
     tQuando(iso)                         → "há 3 dias" / "3 days ago"
     tData(iso)                           → 14/10/2026 ou 10/14/2026

   ARMADILHA
   A função chama-se t(), e "t" é um nome tentador para variável local
   ao criar elementos (const t = document.createElement(...)). Dentro de
   uma função que faça isso, QUALQUER chamada a t() quebra com
   "Cannot access 't' before initialization" — e a tela para de desenhar
   no meio. Se esse erro aparecer, procure por uma variável chamada t.
   O nome fica assim mesmo porque é o que todo framework usa: na
   migração, as chamadas passam direto.

   REGRAS
   • Chave que não existe volta como a própria chave, visível na
     tela — erro de digitação aparece, não quebra a página.
   • Idioma sem tradução cai no português. Traduzir aos poucos é
     seguro: o que falta sai em português, não vazio.
   • O idioma é por pessoa (usuarios.idioma). O localStorage guarda
     uma cópia para a primeira pintura da tela não sair no idioma
     errado antes de a sessão carregar.

   ESCOPO DE HOJE
   Traduzidos: entrada, barra lateral, página inicial e
   apontamentos — o que alguém de fora do escritório enxerga.
   Configurações e Administração seguem em português, porque quem
   entra ali é a coordenação da casa.

   Carregar ANTES do sidebar.js:
     <script src="idioma.js?v=1"></script>
   ============================================================ */

const OSPA_IDIOMAS = ['pt', 'en'];
const OSPA_IDIOMA_CHAVE = 'ospa_idioma';

/* ------------------------------------------------------------
   O DICIONÁRIO
   Chaves agrupadas por tela. Valor em lista = [singular, plural],
   usado pelo tn(). %{nome} é substituído pelo tn()/t().
   ------------------------------------------------------------ */
const OSPA_TEXTOS = {

  // ── geral ──
  'g.carregando':      { pt: 'Carregando…',              en: 'Loading…' },
  'g.restaurando':     { pt: 'Restaurando sessão…',      en: 'Restoring session…' },
  'g.identificando':   { pt: 'Identificando usuário…',   en: 'Identifying user…' },
  'g.erro':            { pt: 'Erro: %{msg}',             en: 'Error: %{msg}' },
  'g.salvar':          { pt: 'Salvar',                   en: 'Save' },
  'g.cancelar':        { pt: 'Cancelar',                 en: 'Cancel' },
  'g.confirmar':       { pt: 'Confirmar',                en: 'Confirm' },
  'g.aguarde':         { pt: 'Aguarde…',                 en: 'Please wait…' },
  'g.editar':          { pt: 'Editar',                   en: 'Edit' },
  'g.excluir':         { pt: 'Excluir',                  en: 'Delete' },
  'g.enviar':          { pt: 'Enviar',                   en: 'Send' },
  'g.hoje':            { pt: 'hoje',                     en: 'today' },
  'g.ontem':           { pt: 'ontem',                    en: 'yesterday' },
  'g.ha_dias':         { pt: 'há %{n} dias',             en: '%{n} days ago' },
  'g.nunca':           { pt: 'nunca',                    en: 'never' },
  'g.sem_projeto':     { pt: 'Nenhum projeto especificado. Use ?id=CODIGO na URL.',
                         en: 'No project specified. Use ?id=CODE in the URL.' },
  'g.sem_cadastro':    { pt: 'Usuário não cadastrado no sistema.',
                         en: 'User not registered in the system.' },
  'g.sem_acesso':      { pt: 'Você não tem acesso a este projeto.',
                         en: 'You do not have access to this project.' },

  // ── entrada ──
  'login.email':       { pt: 'Email',                    en: 'Email' },
  'login.senha':       { pt: 'Senha',                    en: 'Password' },
  'login.entrar':      { pt: 'Entrar',                   en: 'Sign in' },
  'login.entrando':    { pt: 'Entrando…',                en: 'Signing in…' },
  'login.restrito':    { pt: 'Acesso restrito',          en: 'Restricted access' },
  'login.titulo_home': { pt: 'Página Inicial do Projeto',  en: 'Project Home' },
  'login.titulo_apontamentos': { pt: 'Apontamentos',       en: 'Issues' },
  'login.preencha':    { pt: 'Preencha email e senha.',  en: 'Fill in email and password.' },
  'login.invalido':    { pt: 'Email ou senha inválidos.', en: 'Invalid email or password.' },
  'login.aviso_registro': { pt: 'Os acessos ao sistema são registrados para fins de coordenação do projeto.',
                            en: 'System access is logged for project coordination purposes.' },
  'login.plataforma':  { pt: 'Plataforma de <b>compatibilização</b>',
                         en: 'Design <b>coordination</b> platform' },
  'login.plataforma_txt': { pt: 'Plataforma de compatibilização', en: 'Design coordination platform' },
  'login.descricao':   { pt: 'Compatibilização de projetos e comunicação entre projetistas.',
                         en: 'Design coordination and communication between consultants.' },
  'login.google':      { pt: 'Entrar com o e-mail OSPA', en: 'Sign in with OSPA email' },
  'login.ou':          { pt: 'ou',                       en: 'or' },
  'login.pedir':       { pt: 'Não tem acesso? Solicite.', en: 'No access? Request it.' },

  // ── lista de projetos (index.html) ──
  'projetos.selecione': { pt: 'Selecione um projeto',    en: 'Select a project' },
  'projetos.buscar':   { pt: 'Buscar por nome, código ou cliente', en: 'Search by name, code or client' },
  'projetos.contagem': { pt: '%{n} projetos',            en: '%{n} projects' },
  'projetos.nenhum':   { pt: 'Nenhum projeto encontrado.', en: 'No projects found.' },
  'projetos.novo':     { pt: 'Novo projeto',             en: 'New project' },
  'projetos.sem_acesso': { pt: 'Você não participa deste projeto', en: 'You are not part of this project' },
  'projetos.admin':    { pt: 'Administração',            en: 'Administration' },
  'projetos.excluidos': { pt: 'Projetos excluídos',      en: 'Deleted projects' },

  // ── solicitação de acesso (acesso.html) ──
  'acesso.titulo':     { pt: 'Solicitar <b>acesso</b>', en: 'Request <b>access</b>' },
  'acesso.descricao':  { pt: 'A plataforma reúne a compatibilização dos projetos da OSPA. O acesso é liberado por projeto, então informe de qual você participa.',
                         en: 'The platform brings together the design coordination of OSPA projects. Access is granted per project, so tell us which one you work on.' },
  'acesso.email':      { pt: 'Seu e-mail',               en: 'Your email' },
  'acesso.nome':       { pt: 'Seu nome',                 en: 'Your name' },
  'acesso.empresa':    { pt: 'Sua empresa',              en: 'Your company' },
  'acesso.projeto':    { pt: 'De qual projeto você participa', en: 'Which project you work on' },
  'acesso.projeto_ph': { pt: 'Nome do empreendimento',   en: 'Development name' },
  'acesso.enviar':     { pt: 'Solicitar acesso',         en: 'Request access' },
  'acesso.enviando':   { pt: 'Enviando…',                en: 'Sending…' },
  'acesso.enviado':    { pt: 'Pedido enviado. A OSPA vai analisar e entrar em contato pelo e-mail informado.',
                         en: 'Request sent. OSPA will review it and contact you at the email provided.' },
  'acesso.falhou':     { pt: 'Não foi possível enviar. Tente de novo.', en: 'Could not send. Please try again.' },
  'acesso.ja_tem':     { pt: 'Já tem acesso?',           en: 'Already have access?' },
  'acesso.entrar':     { pt: 'Entrar',                   en: 'Sign in' },

  // ── troca de senha ──
  'senha.entre_antes': { pt: 'Entre no sistema primeiro.', en: 'Sign in first.' },
  'senha.nova':        { pt: 'Nova senha (mínimo 8 caracteres):',
                         en: 'New password (at least 8 characters):' },
  'senha.curta':       { pt: 'A senha precisa ter ao menos 8 caracteres.',
                         en: 'The password must have at least 8 characters.' },
  'senha.repita':      { pt: 'Repita a nova senha:',     en: 'Repeat the new password:' },
  'senha.difere':      { pt: 'As senhas não conferem.',  en: 'The passwords do not match.' },
  'senha.falhou':      { pt: 'Não foi possível trocar a senha.',
                         en: 'Could not change the password.' },
  'senha.trocada':     { pt: 'Senha alterada. Ela já vale para os próximos acessos.',
                         en: 'Password changed. It applies from your next sign-in.' },

  // ── barra lateral ──
  'nav.inicio':        { pt: 'Página inicial',           en: 'Home' },
  'nav.relatorio':     { pt: 'Relatório',                en: 'Report' },
  'nav.apontamentos':  { pt: 'Apontamentos',             en: 'Issues' },
  'nav.documentos':    { pt: 'Documentos',               en: 'Documents' },
  'nav.monitor':       { pt: 'Monitor de Conflitos',     en: 'Clash Monitor' },
  'nav.analise':       { pt: 'Análise',                  en: 'Analysis' },
  'nav.editor':        { pt: 'Editor',                   en: 'Editor' },
  'nav.configuracoes': { pt: 'Configurações',            en: 'Settings' },
  'nav.senha':         { pt: 'Trocar senha',             en: 'Change password' },
  'nav.sair':          { pt: 'Sair',                     en: 'Sign out' },
  'nav.abrindo':       { pt: 'Abrindo…',                 en: 'Opening…' },
  'nav.editor_falta':  { pt: 'Editor não disponível nesta página ainda.',
                         en: 'The editor is not available on this page yet.' },
  'nav.arquivos_novos':{ pt: ['%{n} arquivo novo', '%{n} arquivos novos'],
                         en: ['%{n} new file', '%{n} new files'] },
  'nav.arquivos_100':  { pt: '100+ arquivos novos',      en: '100+ new files' },
  'nav.ap_esperando':  { pt: ['%{n} apontamento esperando você', '%{n} apontamentos esperando você'],
                         en: ['%{n} issue waiting for you', '%{n} issues waiting for you'] },

  // ── página inicial ──
  'home.carregando_projeto': { pt: 'Carregando projeto…', en: 'Loading project…' },
  'home.responsavel':  { pt: 'Responsável técnico: %{nome}',
                         en: 'Technical lead: %{nome}' },
  'home.recente':      { pt: 'Nos últimos 7 dias: %{itens}',
                         en: 'In the last 7 days: %{itens}' },
  'home.fichas_novas': { pt: ['%{n} ficha nova', '%{n} fichas novas'],
                         en: ['%{n} new clash', '%{n} new clashes'] },
  'home.arquivos':     { pt: ['%{n} arquivo', '%{n} arquivos'],
                         en: ['%{n} file', '%{n} files'] },
  'home.comentarios':  { pt: ['%{n} comentário', '%{n} comentários'],
                         en: ['%{n} comment', '%{n} comments'] },
  'home.apontamentos': { pt: ['%{n} apontamento', '%{n} apontamentos'],
                         en: ['%{n} issue', '%{n} issues'] },
  'home.aguardando':   { pt: ['ficha aguardando sua resposta', 'fichas aguardando sua resposta'],
                         en: ['clash awaiting your reply', 'clashes awaiting your reply'] },
  'home.mais_antiga':  { pt: 'a mais antiga há %{n} dias', en: 'the oldest %{n} days ago' },
  'home.abertos':      { pt: ['conflito aberto', 'conflitos abertos'],
                         en: ['open clash', 'open clashes'] },
  'home.abertos_em':   { pt: ' em %{discs}',             en: ' in %{discs}' },
  'home.criticos':     { pt: ['marcado como crítico', 'marcados como críticos'],
                         en: ['marked as critical', 'marked as critical'] },
  'home.ap_dirigidos': { pt: ['apontamento dirigido a você', 'apontamentos dirigidos a você'],
                         en: ['issue addressed to you', 'issues addressed to you'] },
  'home.ap_sem_resposta': { pt: '%{n} sem nenhuma resposta', en: '%{n} with no reply yet' },
  'home.ap_atrasados': { pt: '%{n} com prazo vencido', en: '%{n} past the due date' },
  'home.saude_titulo': { pt: 'Saúde',                    en: 'Health' },
  'home.saude_projeto':{ pt: 'Projeto',                  en: 'Project' },
  'home.saude_disciplina': { pt: 'Sua disciplina',       en: 'Your discipline' },
  'home.saude_resolvidas': { pt: '%{r}/%{n} fichas resolvidas', en: '%{r}/%{n} clashes resolved' },
  'home.saude_abertas':{ pt: ['%{n} em aberto', '%{n} em aberto'], en: ['%{n} open', '%{n} open'] },
  'home.criticos_n':   { pt: ['%{n} crítico', '%{n} críticos'], en: ['%{n} critical', '%{n} critical'] },
  'home.escrever_para':{ pt: 'Escrever e-mail',          en: 'Send email' },
  'home.ap_atrasados_rot': { pt: ['apontamento com prazo vencido', 'apontamentos com prazo vencido'],
                             en: ['issue past the due date', 'issues past the due date'] },
  'home.col_pessoa':   { pt: 'Pessoa',                   en: 'Person' },
  'home.col_empresa':  { pt: 'Empresa',                  en: 'Company' },
  'home.col_disc':     { pt: 'Disciplinas',              en: 'Disciplines' },
  'home.col_devendo':  { pt: 'Devendo',                  en: 'Owing' },
  'home.col_antiga':   { pt: 'Mais antiga',              en: 'Oldest' },
  'home.col_acesso':   { pt: 'Último acesso',            en: 'Last access' },
  'home.notas_label':  { pt: 'Notas',                    en: 'Notes' },
  'home.equipe_label': { pt: 'Equipe',                   en: 'Team' },
  'home.equipe_vazia': { pt: 'Nenhum usuário vinculado a este projeto.',
                         en: 'No users linked to this project.' },
  'home.coordenador':  { pt: 'Coordenador',              en: 'Coordinator' },
  'home.projetista':   { pt: 'Projetista',               en: 'Designer' },
  'home.admin':        { pt: 'Admin',                    en: 'Admin' },
  'home.em_dia':       { pt: 'em dia',                   en: 'up to date' },
  'home.atencao':      { pt: 'atenção',                  en: 'attention' },
  'home.critico':      { pt: 'crítico',                  en: 'critical' },

  // ── apontamentos ──
  'ap.titulo_tela':    { pt: 'APONTAMENTOS',             en: 'ISSUES' },
  'ap.carregando':     { pt: 'Carregando apontamentos…', en: 'Loading issues…' },
  'ap.mostrar':        { pt: 'Mostrar',                  en: 'Show' },
  'ap.em_aberto':      { pt: 'Pendentes',                en: 'Pending' },
  'ap.resolvidos':     { pt: 'Resolvidos',               en: 'Resolved' },
  'ap.todos':          { pt: 'Todos',                    en: 'All' },
  'ap.para_mim':       { pt: 'Para mim',                 en: 'For me' },
  'ap.que_eu_abri':    { pt: 'Que eu abri',              en: 'Opened by me' },
  'ap.novo':           { pt: '+ Novo apontamento',       en: '+ New issue' },
  'ap.contagem':       { pt: ['%{n} apontamento', '%{n} apontamentos'],
                         en: ['%{n} issue', '%{n} issues'] },
  'ap.abertos_projeto':{ pt: '%{n} pendentes no projeto', en: '%{n} pending in this project' },
  'ap.vazio_filtro':   { pt: 'Nenhum apontamento com esse filtro.',
                         en: 'No issues match this filter.' },
  'ap.vazio_titulo':   { pt: 'Nenhum apontamento neste projeto ainda.',
                         en: 'No issues in this project yet.' },
  'ap.vazio_dica':     { pt: 'Use <b>+ Novo apontamento</b> para registrar uma dúvida ou um pedido —<br>dirigido a uma ou mais disciplinas, à coordenação ou a todos, com imagem se ajudar.',
                         en: 'Use <b>+ New issue</b> to record a question or a request —<br>addressed to one or more disciplines, to coordination or to everyone, with an image if it helps.' },
  'ap.status_aberto':  { pt: 'Pendente',                 en: 'Pending' },
  'ap.status_resolvido':{ pt: 'Resolvido',               en: 'Resolved' },
  'ap.para_coordenacao':{ pt: '→ Coordenação',          en: '→ Coordination' },
  'ap.respostas':      { pt: ['%{n} resposta', '%{n} respostas'],
                         en: ['%{n} reply', '%{n} replies'] },
  'ap.responder':      { pt: 'Responder',                en: 'Reply' },
  'ap.fechar_conversa':{ pt: 'Fechar conversa',          en: 'Close thread' },
  'ap.marcar_resolvido':{ pt: 'Marcar resolvido',        en: 'Mark resolved' },
  'ap.reabrir':        { pt: 'Reabrir',                  en: 'Reopen' },
  'ap.virar_ficha':    { pt: '↑ Virar ficha',            en: '↑ Turn into clash' },
  'ap.virar_ficha_dica':{ pt: 'Cria uma ficha de conflito no relatório com este conteúdo',
                          en: 'Creates a clash record in the report from this content' },
  'ap.virou_ficha':    { pt: '✓ Virou a ficha %{codigo} no relatório de conflitos',
                         en: '✓ Became clash %{codigo} in the clash report' },
  'ap.sem_respostas':  { pt: 'Nenhuma resposta ainda.',  en: 'No replies yet.' },
  'ap.responder_ph':   { pt: 'Responder…',               en: 'Reply…' },
  'ap.enviando':       { pt: 'Enviando…',                en: 'Sending…' },
  'ap.resposta_enviada':{ pt: 'Resposta enviada.',       en: 'Reply sent.' },
  'ap.escreva_algo':   { pt: 'Escreva algo ou anexe uma imagem.',
                         en: 'Write something or attach an image.' },
  'ap.anexar':         { pt: '+ Anexar imagem',          en: '+ Attach image' },
  'ap.anexar_outra':   { pt: '+ Outra imagem',           en: '+ Another image' },
  'ap.novo_titulo':    { pt: 'Novo apontamento',         en: 'New issue' },
  'ap.campo_titulo':   { pt: 'Título',                   en: 'Title' },
  'ap.campo_titulo_ph':{ pt: 'Em uma linha: do que se trata',
                         en: 'In one line: what this is about' },
  'ap.campo_desc':     { pt: 'Descrição',                en: 'Description' },
  'ap.campo_desc_ph':  { pt: 'O que você observou, onde, e o que precisa ser decidido',
                         en: 'What you noticed, where, and what needs deciding' },
  'ap.campo_destino':  { pt: 'Dirigido a',               en: 'Addressed to' },
  'ap.destino_coord':  { pt: 'Coordenação',              en: 'Coordination' },
  'ap.destino_dica':   { pt: 'Uma ou mais disciplinas, a coordenação ou todos. Quem recebe vê o apontamento e pode responder; a coordenação vê todos.',
                         en: 'One or more disciplines, coordination or everyone. Recipients see the issue and can reply; coordination sees all of them.' },
  'ap.destino_dica_sem':{ pt: 'Este projeto não tem disciplinas cadastradas, então o destino é a coordenação.',
                          en: 'This project has no disciplines registered, so the recipient is coordination.' },
  'ap.destino_todos':  { pt: 'Todos',                    en: 'Everyone' },
  'ap.destino_escolha':{ pt: 'Escolha ao menos um destinatário.', en: 'Choose at least one recipient.' },
  'ap.campo_prazo':    { pt: 'Prazo',                    en: 'Due date' },
  'ap.campo_local':    { pt: 'Local',                    en: 'Location' },
  'ap.sem_local':      { pt: '— sem local —',            en: '— no location —' },
  'ap.campo_critico':  { pt: 'Crítico',                  en: 'Critical' },
  'ap.critico_dica':   { pt: 'Destaca o apontamento no topo da lista, como o alerta das fichas.',
                         en: 'Highlights the issue at the top of the list, like the clash alert.' },
  'ap.critico_por':    { pt: 'Não crítico — clique para marcar como crítico', en: 'Not critical — click to mark as critical' },
  'ap.critico_tirar':  { pt: 'Crítico — clique para desmarcar', en: 'Critical — click to unmark' },
  'ap.critico_posto':  { pt: 'Marcado como crítico.',    en: 'Marked as critical.' },
  'ap.critico_tirado': { pt: 'Não é mais crítico.',      en: 'No longer critical.' },
  'ap.status_clique_resolver': { pt: 'Pendente — clique para marcar como resolvido', en: 'Pending — click to mark as resolved' },
  'ap.status_clique_reabrir':  { pt: 'Resolvido — clique para reabrir', en: 'Resolved — click to reopen' },
  'ap.prazo':          { pt: 'Prazo %{data}',            en: 'Due %{data}' },
  'ap.atrasado':       { pt: 'atrasado',                 en: 'overdue' },
  'ap.atrasados':      { pt: 'Atrasados',                en: 'Overdue' },
  'ap.criticos':       { pt: 'Críticos',                 en: 'Critical' },
  'ap.local':          { pt: 'Local %{local}',           en: 'Location %{local}' },
  'ap.ev_destinos':    { pt: 'mudou os destinatários para %{lista}', en: 'changed the recipients to %{lista}' },
  'ap.ev_prazo':       { pt: 'definiu o prazo para %{data}', en: 'set the due date to %{data}' },
  'ap.ev_prazo_sem':   { pt: 'removeu o prazo',          en: 'removed the due date' },
  'ap.ev_local':       { pt: 'definiu o local: %{local}', en: 'set the location: %{local}' },
  'ap.ev_local_sem':   { pt: 'removeu o local',          en: 'removed the location' },
  'ap.ev_critico_sim': { pt: 'marcou como crítico',      en: 'marked as critical' },
  'ap.ev_critico_nao': { pt: 'tirou a marcação de crítico', en: 'removed the critical mark' },
  'ap.ev_resolvido':   { pt: 'marcou como resolvido',    en: 'marked as resolved' },
  'ap.ev_reaberto':    { pt: 'reabriu',                  en: 'reopened' },
  'ap.ev_editado':     { pt: 'editou o texto ou as imagens', en: 'edited the text or images' },
  'ap.ev_promovido':   { pt: 'transformou na ficha %{codigo}', en: 'turned it into clash %{codigo}' },
  'ap.campo_imagens':  { pt: 'Imagens',                  en: 'Images' },
  'ap.colar_dica':     { pt: 'ou cole (Ctrl+V) / arraste aqui', en: 'or paste (Ctrl+V) / drop here' },
  'ap.registrar':      { pt: 'Registrar',                en: 'Create' },
  'ap.registrado':     { pt: 'Apontamento registrado.',  en: 'Issue created.' },
  'ap.titulo_curto':   { pt: 'Escreva um título com ao menos 3 letras.',
                         en: 'Write a title with at least 3 characters.' },
  'ap.editar_titulo':  { pt: 'Editar %{codigo}',         en: 'Edit %{codigo}' },
  'ap.editar_imagens_dica': { pt: 'Clique no × para remover uma imagem.',
                              en: 'Click × to remove an image.' },
  'ap.editar_aviso_ficha': { pt: 'Este apontamento já virou a ficha %{codigo}: as imagens de lá foram copiadas na promoção e não mudam com esta edição.',
                             en: 'This issue already became clash %{codigo}: its images were copied at promotion time and will not change with this edit.' },
  'ap.atualizado':     { pt: 'Apontamento atualizado.',  en: 'Issue updated.' },
  'ap.promover_titulo':{ pt: 'Virar ficha — %{codigo}',  en: 'Turn into clash — %{codigo}' },
  'ap.promover_aviso': { pt: 'Cria uma ficha de conflito no relatório com o texto e as imagens deste apontamento, como <b>rascunho não publicado</b> — você revisa e publica pelo Editor. A origem fica registrada na ficha.',
                         en: 'Creates a clash record in the report with this issue\'s text and images, as an <b>unpublished draft</b> — you review and publish it in the Editor. The origin is recorded on the clash.' },
  'ap.promover_disc':  { pt: 'Disciplinas da ficha',     en: 'Disciplines of the clash' },
  'ap.promover_sem_disc':{ pt: 'Nenhuma disciplina ativa cadastrada neste projeto.',
                           en: 'No active disciplines registered in this project.' },
  'ap.promover_pav':   { pt: 'Pavimento',                en: 'Floor' },
  'ap.promover_pav_ph':{ pt: 'Sigla do pavimento, se já souber (ex: TER)',
                         en: 'Floor code, if you already know it (e.g. GRD)' },
  'ap.promover_ok':    { pt: 'Criar ficha',              en: 'Create clash' },
  'ap.promover_escolha':{ pt: 'Escolha ao menos uma disciplina para a ficha.',
                          en: 'Choose at least one discipline for the clash.' },
  'ap.promovido':      { pt: 'Ficha criada como rascunho. Revise e publique pelo Editor.',
                         en: 'Clash created as a draft. Review and publish it in the Editor.' },
  'ap.resolvido_ok':   { pt: 'Marcado como resolvido.',  en: 'Marked as resolved.' },
  'ap.reaberto':       { pt: 'Apontamento reaberto.',    en: 'Issue reopened.' },
  'ap.excluir_conf':   { pt: 'Excluir o apontamento %{codigo}? Isso apaga também as respostas.',
                         en: 'Delete issue %{codigo}? This also deletes the replies.' },
  'ap.excluido':       { pt: 'Apontamento excluído.',    en: 'Issue deleted.' }
};

/* ------------------------------------------------------------
   ESTADO
   ------------------------------------------------------------ */
let _ospaIdioma = null;

function ospaIdioma() {
  if (_ospaIdioma) return _ospaIdioma;
  let salvo = null;
  try { salvo = localStorage.getItem(OSPA_IDIOMA_CHAVE); } catch (e) {}
  _ospaIdioma = (OSPA_IDIOMAS.indexOf(salvo) !== -1) ? salvo : 'pt';
  return _ospaIdioma;
}

// Aplica o idioma que veio do cadastro da pessoa. Não grava no banco e
// não recarrega: as telas chamam isto ANTES de desenhar, então basta
// trocar a variável.
function ospaIdiomaDaSessao(idioma) {
  if (OSPA_IDIOMAS.indexOf(idioma) === -1) return ospaIdioma();
  _ospaIdioma = idioma;
  try { localStorage.setItem(OSPA_IDIOMA_CHAVE, idioma); } catch (e) {}
  document.documentElement.lang = (idioma === 'en') ? 'en' : 'pt-BR';
  return idioma;
}

// Troca pedida pela pessoa: guarda no cadastro dela e recarrega a
// página. Recarregar é de propósito — garante que a tela inteira venha
// no idioma novo, em vez de metade traduzida.
async function ospaTrocarIdioma(idioma) {
  if (OSPA_IDIOMAS.indexOf(idioma) === -1) return;
  try { localStorage.setItem(OSPA_IDIOMA_CHAVE, idioma); } catch (e) {}
  try {
    if (typeof rpc === 'function') await rpc('usr_idioma', { p_idioma: idioma });
  } catch (e) {
    // sem conexão ou função ainda não aplicada: vale pelo navegador
  }
  location.reload();
}

/* ------------------------------------------------------------
   BUSCA DO TEXTO
   ------------------------------------------------------------ */
function _ospaValor(chave) {
  const e = OSPA_TEXTOS[chave];
  if (!e) return null;
  const v = e[ospaIdioma()];
  return (v === undefined || v === null) ? e.pt : v;   // falta tradução → português
}

function _ospaInterpolar(texto, subs) {
  if (!subs) return texto;
  return String(texto).replace(/%\{(\w+)\}/g, function (_, nome) {
    return (subs[nome] === undefined || subs[nome] === null) ? '' : String(subs[nome]);
  });
}

function t(chave, subs) {
  const v = _ospaValor(chave);
  if (v === null) return chave;                 // chave errada aparece na tela
  return _ospaInterpolar(Array.isArray(v) ? v[1] : v, subs);
}

// Plural pelo número. O inglês e o português concordam na regra simples
// (1 = singular, resto = plural), que é a que estas telas precisam.
function tn(chave, n, subs) {
  const v = _ospaValor(chave);
  if (v === null) return chave;
  const forma = Array.isArray(v) ? (Math.abs(Number(n)) === 1 ? v[0] : v[1]) : v;
  return _ospaInterpolar(forma, Object.assign({ n: n }, subs || {}));
}

/* ------------------------------------------------------------
   DATAS
   ------------------------------------------------------------ */
function _ospaLocale() { return ospaIdioma() === 'en' ? 'en-US' : 'pt-BR'; }

function tData(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(_ospaLocale());
}

function tDataHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(_ospaLocale(),
    { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// "hoje", "ontem", "há 3 dias" — e a data cheia quando passa de um mês
function tQuando(iso) {
  if (!iso) return '';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return t('g.hoje');
  if (dias === 1) return t('g.ontem');
  if (dias < 30)  return t('g.ha_dias', { n: dias });
  return tData(iso);
}

/* ------------------------------------------------------------
   TEXTO FIXO NO HTML
   Para os poucos textos que moram na marcação em vez do script:
     <div data-t="g.carregando"></div>
     <input data-t-ph="login.email">
   ------------------------------------------------------------ */
function ospaTraduzirDOM(raiz) {
  const r = raiz || document;
  r.querySelectorAll('[data-t]').forEach(function (el) {
    el.textContent = t(el.dataset.t);
  });
  r.querySelectorAll('[data-t-ph]').forEach(function (el) {
    el.placeholder = t(el.dataset.tPh);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.documentElement.lang = (ospaIdioma() === 'en') ? 'en' : 'pt-BR';
  ospaTraduzirDOM();
});
