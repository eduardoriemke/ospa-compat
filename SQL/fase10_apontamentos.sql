-- ============================================================
-- OSPA Compat — FASE 10: APONTAMENTOS
--
-- POR QUE TABELA NOVA, E NÃO UM CAMPO NA FICHA
--
-- São dois objetos diferentes. A ficha de conflito nasce da análise
-- da coordenação, de cima para baixo: cruza disciplinas, tem grau,
-- entra no relatório e se resolve quando cada disciplina dá seu
-- status. O apontamento nasce de quem está trabalhando: tem autor e
-- destinatário, e se resolve na conversa.
--
-- Na mesma tabela, a ficha ganharia campos que não usa e o
-- apontamento herdaria a máquina de status por disciplina, que não
-- tem a quem perguntar. Separados, o fluxo de compatibilização que
-- está em produção não é tocado em nada.
--
-- O QUE ENTRA
--
--   apontamentos            o apontamento em si, com as imagens
--   apontamento_respostas   a conversa, também com imagens
--   ap_*                    as operações, todas com permissão no banco
--
-- QUEM VÊ O QUÊ (conferido no banco, não na tela)
--   • o autor vê o seu
--   • a coordenação vê todos
--   • se o destino é uma disciplina, vê quem responde por ela
--   Qualquer um do projeto CRIA — é o ponto da coisa: hoje o que o
--   projetista percebe só chega à coordenação por fora do sistema.
--
-- NUMERAÇÃO NO SERVIDOR
--   O código (A-01) é gerado aqui dentro, com trava por projeto.
--   A ficha ainda calcula o dela no navegador, a partir da lista
--   carregada — com duas pessoas criando ao mesmo tempo, saem dois
--   números iguais. Aqui isso não acontece.
--
-- IMAGENS
--   Vão em coluna jsonb, como já acontece em comentarios.imagens:
--   data URL de JPEG reduzido a 1200px pelo navegador. Não é o
--   ideal — é base64 dentro do banco, e foi isso que estourou o
--   backup uma vez — mas é o padrão que já existe, e tirar imagem
--   de dentro do banco é uma migração só, que depois atende fichas,
--   comentários e apontamentos de uma vez.
--
-- Reversão: fase10_reverter.sql
-- ============================================================

begin;

-- ════════════════════ TABELAS ════════════════════════════════

create table if not exists apontamentos (
  id             bigserial primary key,
  projeto_id     text not null references projetos(id) on delete cascade,
  codigo         text not null,
  titulo         text not null,
  descricao      text,
  imagens        jsonb,
  autor_id       uuid not null references usuarios(id),
  autor_nome     text not null,          -- como em comentarios: o nome da época
  destino_tipo   text not null,          -- 'coordenacao' | 'disciplina'
  destino_disciplina text,               -- preenchido só quando destino_tipo='disciplina'
  status         text not null default 'ABERTO',   -- 'ABERTO' | 'RESOLVIDO'
  created_at     timestamptz not null default now(),
  resolvido_em   timestamptz,
  resolvido_por  uuid references usuarios(id),
  ficha_id       bigint references conflitos(id) on delete set null,  -- se foi promovido
  constraint apontamentos_codigo_unico unique (projeto_id, codigo),
  constraint apontamentos_status_valido check (status in ('ABERTO','RESOLVIDO')),
  constraint apontamentos_destino_valido check (
    (destino_tipo = 'coordenacao' and destino_disciplina is null) or
    (destino_tipo = 'disciplina'  and destino_disciplina is not null)
  )
);

create index if not exists apontamentos_projeto    on apontamentos (projeto_id, status);
create index if not exists apontamentos_autor      on apontamentos (autor_id);
create index if not exists apontamentos_destino    on apontamentos (projeto_id, destino_disciplina);

create table if not exists apontamento_respostas (
  id              bigserial primary key,
  apontamento_id  bigint not null references apontamentos(id) on delete cascade,
  usuario_id      uuid not null references usuarios(id),
  usuario_nome    text not null,
  texto           text not null,
  imagens         jsonb,
  edited          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists apontamento_respostas_pai on apontamento_respostas (apontamento_id, created_at);

-- Tabela nova no Supabase nasce com RLS LIGADO: as linhas entram e a
-- leitura devolve vazio, sem erro nenhum. Já aconteceu com "acessos".
-- Enquanto o RLS não for desenhado para o sistema todo, desligamos aqui
-- igual ao resto das tabelas — a proteção real está nas funções ap_*.
alter table apontamentos          disable row level security;
alter table apontamento_respostas disable row level security;

-- ════════════════════ QUEM VÊ ════════════════════════════════

-- Uma função só decide a visibilidade, e todas as outras a usam.
-- Em um lugar, dá para conferir de olho.
create or replace function ap_pode_ver(p_apontamento bigint)
returns boolean language sql stable as $$
  select exists (
    select 1 from apontamentos a
    where a.id = p_apontamento
      and (
        a.autor_id = auth.uid()
        or cfg_pode_configurar(a.projeto_id)
        or (a.destino_tipo = 'disciplina' and exists (
              select 1 from projeto_usuarios_v2 pu
              where pu.usuario_id = auth.uid()
                and pu.projeto_id = a.projeto_id
                and a.destino_disciplina = any(coalesce(pu.disciplinas, '{}'))))
      )
  );
$$;

create or replace function ap_exigir_ver(p_apontamento bigint)
returns void language plpgsql as $$
begin
  if not ap_pode_ver(p_apontamento) then
    raise exception 'Apontamento não encontrado.';   -- não revela que existe
  end if;
end $$;

-- Participar do projeto é o que dá direito a criar e a responder.
create or replace function ap_exigir_participante(p_projeto text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from usuarios u
                 where u.id = auth.uid() and u.papel_global = 'admin')
     and not exists (select 1 from projeto_usuarios_v2 pu
                     where pu.usuario_id = auth.uid() and pu.projeto_id = p_projeto)
  then
    raise exception 'Você não participa deste projeto.';
  end if;
end $$;

-- Fechar e reabrir: autor, destino ou coordenação.
create or replace function ap_pode_resolver(p_apontamento bigint)
returns boolean language sql stable as $$
  select exists (
    select 1 from apontamentos a
    where a.id = p_apontamento
      and (
        a.autor_id = auth.uid()
        or cfg_pode_configurar(a.projeto_id)
        or (a.destino_tipo = 'disciplina' and exists (
              select 1 from projeto_usuarios_v2 pu
              where pu.usuario_id = auth.uid()
                and pu.projeto_id = a.projeto_id
                and a.destino_disciplina = any(coalesce(pu.disciplinas, '{}'))))
      )
  );
$$;

-- ════════════════════ OPERAÇÕES ══════════════════════════════

-- Próximo código do projeto. O contador fica guardado e nunca volta —
-- de propósito: se fosse "o maior que existe mais um", apagar o A-02
-- faria o próximo nascer A-02 também, e aí um código citado numa
-- reunião ou num e-mail passaria a apontar para outra coisa.
--
-- O upsert também resolve a corrida: dois cliques ao mesmo tempo
-- esperam um pelo outro na mesma linha, em vez de gerarem o mesmo
-- número. (A ficha de conflito ainda calcula o código no navegador;
-- é dívida conhecida, anotada no ESTADO.md.)
create table if not exists apontamento_seq (
  projeto_id text primary key references projetos(id) on delete cascade,
  ultimo     int  not null default 0
);
alter table apontamento_seq disable row level security;

create or replace function ap_proximo_codigo(p_projeto text)
returns text language plpgsql as $$
declare v_n int;
begin
  insert into apontamento_seq (projeto_id, ultimo)
  values (p_projeto, 1)
  on conflict (projeto_id) do update set ultimo = apontamento_seq.ultimo + 1
  returning ultimo into v_n;

  -- Projeto que já tinha apontamentos antes desta tabela existir:
  -- pula para depois do maior código em uso.
  if exists (select 1 from apontamentos a
             where a.projeto_id = p_projeto
               and substring(a.codigo from 'A-([0-9]+)')::int >= v_n) then
    select max(substring(a.codigo from 'A-([0-9]+)')::int) + 1 into v_n
      from apontamentos a where a.projeto_id = p_projeto;
    update apontamento_seq set ultimo = v_n where projeto_id = p_projeto;
  end if;

  return 'A-' || lpad(v_n::text, 2, '0');
end $$;

create or replace function ap_criar(
  p_projeto    text,
  p_titulo     text,
  p_descricao  text,
  p_destino_tipo text,
  p_destino_disciplina text,
  p_imagens    jsonb
) returns bigint language plpgsql as $$
declare
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_nome   text;
  v_id     bigint;
begin
  perform ap_exigir_participante(p_projeto);

  if length(v_titulo) < 3 then
    raise exception 'Escreva um título com ao menos 3 letras.';
  end if;
  if p_destino_tipo not in ('coordenacao','disciplina') then
    raise exception 'Destino inválido.';
  end if;
  if p_destino_tipo = 'disciplina' then
    if not exists (select 1 from disciplinas d
                   where d.projeto_id = p_projeto
                     and d.sigla = p_destino_disciplina and d.ativa) then
      raise exception '% não é uma disciplina ativa deste projeto.', coalesce(p_destino_disciplina, '(vazio)');
    end if;
  end if;

  select coalesce(nome, email) into v_nome from usuarios where id = auth.uid();

  insert into apontamentos (projeto_id, codigo, titulo, descricao, imagens,
                            autor_id, autor_nome, destino_tipo, destino_disciplina)
  values (p_projeto, ap_proximo_codigo(p_projeto), v_titulo,
          nullif(trim(coalesce(p_descricao, '')), ''),
          case when p_imagens is null or p_imagens = 'null'::jsonb
                 or jsonb_array_length(coalesce(p_imagens, '[]'::jsonb)) = 0
               then null else p_imagens end,
          auth.uid(), coalesce(v_nome, '(sem nome)'),
          p_destino_tipo,
          case when p_destino_tipo = 'disciplina' then p_destino_disciplina end)
  returning id into v_id;

  return v_id;
end $$;

-- A lista já vem filtrada pelo que a pessoa pode ver, com a contagem de
-- respostas e se ela mesma é o destino (a tela usa para destacar).
create or replace function ap_listar(p_projeto text)
returns table(id bigint, codigo text, titulo text, descricao text,
              imagens jsonb, autor_id uuid, autor_nome text,
              destino_tipo text, destino_disciplina text,
              status text, created_at timestamptz,
              resolvido_em timestamptz, ficha_id bigint, ficha_codigo text,
              respostas bigint, ultima_resposta timestamptz,
              sou_autor boolean, sou_destino boolean)
language plpgsql stable as $$
declare v_minhas text[];
begin
  perform ap_exigir_participante(p_projeto);

  select coalesce(pu.disciplinas, '{}') into v_minhas
    from projeto_usuarios_v2 pu
   where pu.usuario_id = auth.uid() and pu.projeto_id = p_projeto;
  v_minhas := coalesce(v_minhas, '{}');

  return query
    select a.id, a.codigo, a.titulo, a.descricao, a.imagens,
           a.autor_id, a.autor_nome, a.destino_tipo, a.destino_disciplina,
           a.status, a.created_at, a.resolvido_em, a.ficha_id,
           (select c.codigo from conflitos c where c.id = a.ficha_id),
           (select count(*) from apontamento_respostas r where r.apontamento_id = a.id),
           (select max(r.created_at) from apontamento_respostas r where r.apontamento_id = a.id),
           a.autor_id = auth.uid(),
           a.destino_tipo = 'disciplina' and a.destino_disciplina = any(v_minhas)
      from apontamentos a
     where a.projeto_id = p_projeto
       and ( a.autor_id = auth.uid()
          or cfg_pode_configurar(p_projeto)
          or (a.destino_tipo = 'disciplina' and a.destino_disciplina = any(v_minhas)) )
     order by (a.status = 'RESOLVIDO'), a.created_at desc;
end $$;

create or replace function ap_respostas(p_apontamento bigint)
returns table(id bigint, usuario_id uuid, usuario_nome text, texto text,
              imagens jsonb, edited boolean, created_at timestamptz,
              sou_autor boolean)
language plpgsql stable as $$
begin
  perform ap_exigir_ver(p_apontamento);
  return query
    select r.id, r.usuario_id, r.usuario_nome, r.texto, r.imagens,
           r.edited, r.created_at, r.usuario_id = auth.uid()
      from apontamento_respostas r
     where r.apontamento_id = p_apontamento
     order by r.created_at;
end $$;

create or replace function ap_responder(p_apontamento bigint, p_texto text, p_imagens jsonb)
returns bigint language plpgsql as $$
declare
  v_texto text := trim(coalesce(p_texto, ''));
  v_nome  text;
  v_id    bigint;
  v_imgs  jsonb;
begin
  perform ap_exigir_ver(p_apontamento);

  v_imgs := case when p_imagens is null or p_imagens = 'null'::jsonb
                   or jsonb_array_length(coalesce(p_imagens, '[]'::jsonb)) = 0
                 then null else p_imagens end;

  if length(v_texto) = 0 and v_imgs is null then
    raise exception 'Escreva algo ou anexe uma imagem.';
  end if;

  select coalesce(nome, email) into v_nome from usuarios where id = auth.uid();

  insert into apontamento_respostas (apontamento_id, usuario_id, usuario_nome, texto, imagens)
  values (p_apontamento, auth.uid(), coalesce(v_nome, '(sem nome)'), v_texto, v_imgs)
  returning id into v_id;

  return v_id;
end $$;

create or replace function ap_resolver(p_apontamento bigint, p_resolvido boolean)
returns void language plpgsql as $$
begin
  if not ap_pode_resolver(p_apontamento) then
    raise exception 'Só quem abriu, quem recebeu ou a coordenação pode fechar este apontamento.';
  end if;
  update apontamentos set
    status        = case when p_resolvido then 'RESOLVIDO' else 'ABERTO' end,
    resolvido_em  = case when p_resolvido then now() end,
    resolvido_por = case when p_resolvido then auth.uid() end
   where id = p_apontamento;
end $$;

-- Editar o texto: o autor, enquanto é dele, e a coordenação sempre.
create or replace function ap_editar(p_apontamento bigint, p_titulo text, p_descricao text)
returns void language plpgsql as $$
declare
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_proj   text;
  v_autor  uuid;
begin
  select projeto_id, autor_id into v_proj, v_autor from apontamentos where id = p_apontamento;
  if v_proj is null then raise exception 'Apontamento não encontrado.'; end if;
  if v_autor <> auth.uid() and not cfg_pode_configurar(v_proj) then
    raise exception 'Só quem abriu o apontamento (ou a coordenação) pode editá-lo.';
  end if;
  if length(v_titulo) < 3 then raise exception 'Escreva um título com ao menos 3 letras.'; end if;
  update apontamentos set titulo = v_titulo,
                          descricao = nullif(trim(coalesce(p_descricao, '')), '')
   where id = p_apontamento;
end $$;

-- Excluir: o autor enquanto ninguém respondeu (desistiu de perguntar),
-- e a coordenação sempre. Depois de haver conversa, apagar some com o
-- registro de outras pessoas — daí só a coordenação.
create or replace function ap_excluir(p_apontamento bigint)
returns void language plpgsql as $$
declare
  v_proj  text;
  v_autor uuid;
  v_resp  bigint;
begin
  select a.projeto_id, a.autor_id,
         (select count(*) from apontamento_respostas r where r.apontamento_id = a.id)
    into v_proj, v_autor, v_resp
    from apontamentos a where a.id = p_apontamento;
  if v_proj is null then raise exception 'Apontamento não encontrado.'; end if;

  if cfg_pode_configurar(v_proj) then
    null;                         -- coordenação pode sempre
  elsif v_autor = auth.uid() and v_resp = 0 then
    null;                         -- autor, enquanto ninguém respondeu
  else
    raise exception 'Este apontamento já tem resposta: peça à coordenação para excluir.';
  end if;

  delete from apontamentos where id = p_apontamento;
end $$;

-- ════════════════════ PROMOVER A FICHA ═══════════════════════
-- O caminho inverso do normal: alguém aponta, a coordenação reconhece
-- que é conflito e leva para o relatório. Sem isto, o apontamento seria
-- um canal paralelo; com isto, é a porta de entrada que não existia.
create or replace function ap_promover(p_apontamento bigint, p_disciplinas text[], p_local text)
returns bigint language plpgsql as $$
declare
  a         apontamentos;
  v_codigo  text;
  v_max     int;
  v_ficha   bigint;
  v_img     jsonb;
  v_i       int := 0;
  v_invalida text;
begin
  select * into a from apontamentos where id = p_apontamento;
  if a.id is null then raise exception 'Apontamento não encontrado.'; end if;
  perform cfg_exigir_permissao(a.projeto_id);
  if a.ficha_id is not null then
    raise exception 'Este apontamento já virou a ficha %.',
      (select codigo from conflitos c where c.id = a.ficha_id);
  end if;

  -- Disciplinas da ficha: as informadas, ou a do destino quando houver
  if p_disciplinas is null or array_length(p_disciplinas, 1) is null then
    p_disciplinas := case when a.destino_disciplina is not null
                          then array[a.destino_disciplina] else '{}' end;
  end if;
  select s into v_invalida
    from unnest(p_disciplinas) s
   where not exists (select 1 from disciplinas d
                     where d.projeto_id = a.projeto_id and d.sigla = s and d.ativa)
   limit 1;
  if v_invalida is not null then
    raise exception '% não é uma disciplina ativa deste projeto.', v_invalida;
  end if;

  -- Código da ficha: mesmo formato que o editor usa (C-NN), também com
  -- trava, para não colidir com quem estiver criando ficha pelo editor.
  perform pg_advisory_xact_lock(hashtext('conflitos:' || a.projeto_id));
  select coalesce(max(substring(codigo from 'C-([0-9]+)')::int), 0) into v_max
    from conflitos where projeto_id = a.projeto_id;
  v_codigo := 'C-' || lpad((v_max + 1)::text, 2, '0');

  insert into conflitos (projeto_id, codigo, descricao, proposta, observacao,
                         local, disciplinas, status, alerta, publicado, ordem)
  values (a.projeto_id, v_codigo,
          -- o título vira a primeira linha da descrição: a ficha não tem título
          a.titulo || case when a.descricao is null then '' else E'\n\n' || a.descricao end,
          '', 'Origem: apontamento ' || a.codigo || ' (' || a.autor_nome || ')',
          coalesce(nullif(trim(coalesce(p_local, '')), ''), ''),
          p_disciplinas, 'PENDENTE', false, false,
          (select coalesce(max(ordem), 0) + 1 from conflitos where projeto_id = a.projeto_id))
  returning id into v_ficha;

  -- As imagens vão junto, na tabela que o relatório e o editor já leem
  if a.imagens is not null then
    for v_img in select * from jsonb_array_elements(a.imagens) loop
      insert into imagens (projeto_id, codigo, dados, ordem)
      values (a.projeto_id, v_codigo, trim(both '"' from v_img::text), v_i);
      v_i := v_i + 1;
    end loop;
  end if;

  update apontamentos set ficha_id = v_ficha where id = p_apontamento;
  return v_ficha;
end $$;

-- ════════════════════ PARA O PAINEL ══════════════════════════
-- Quantos apontamentos esperam ESTA pessoa, e quantos ela abriu e
-- seguem em aberto. É o que faz o canal aparecer onde ela já olha.
create or replace function ap_meu_resumo(p_projeto text)
returns table(para_mim bigint, para_mim_sem_resposta bigint, meus_abertos bigint,
              recentes bigint)
language plpgsql stable as $$
declare
  v_minhas text[];
  v_coord  boolean;
begin
  perform ap_exigir_participante(p_projeto);
  select coalesce(pu.disciplinas, '{}') into v_minhas
    from projeto_usuarios_v2 pu
   where pu.usuario_id = auth.uid() and pu.projeto_id = p_projeto;
  v_minhas := coalesce(v_minhas, '{}');
  v_coord := cfg_pode_configurar(p_projeto);

  return query
  with visiveis as (
    select a.*,
           (a.destino_tipo = 'coordenacao' and v_coord)
        or (a.destino_tipo = 'disciplina' and a.destino_disciplina = any(v_minhas))
           as e_para_mim,
           (select count(*) from apontamento_respostas r where r.apontamento_id = a.id) as n_resp
      from apontamentos a
     where a.projeto_id = p_projeto
       and ( a.autor_id = auth.uid() or v_coord
          or (a.destino_tipo = 'disciplina' and a.destino_disciplina = any(v_minhas)) )
  )
  select count(*) filter (where e_para_mim and status = 'ABERTO'),
         count(*) filter (where e_para_mim and status = 'ABERTO' and n_resp = 0),
         count(*) filter (where autor_id = auth.uid() and status = 'ABERTO'),
         count(*) filter (where created_at > now() - interval '7 days')
    from visiveis;
end $$;

commit;
