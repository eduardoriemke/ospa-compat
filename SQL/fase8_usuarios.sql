-- ============================================================
-- OSPA Compat — FASE 8: CRIAR E REDEFINIR CONTAS PELA PLATAFORMA
--
-- Hoje criar um usuário exige sete passos, metade deles no painel do
-- Supabase. Estas funções reduzem a dois: nome e e-mail, depois
-- vincular ao projeto.
--
-- A senha é gerada NO SERVIDOR e devolvida uma única vez, para ser
-- repassada. Ela nunca viaja no pedido nem fica em registro algum.
--
-- ATENÇÃO: estas funções escrevem nas tabelas internas de
-- autenticação do Supabase. É o mesmo que fazíamos à mão — inclusive
-- as colunas de controle que precisam ficar com texto vazio, e não
-- nulas (foi o que causou o erro "Database error querying schema"
-- quando criamos uma conta manualmente). Se a estrutura interna mudar
-- numa atualização, a criação falha com erro claro, sem afetar contas
-- existentes; a saída é voltar a criar pelo painel até ajustarmos.
-- ============================================================

begin;

-- Senha temporária legível: evita caracteres que se confundem (O/0, l/1)
create or replace function usr_senha_temporaria()
returns text language sql volatile as $$
  select string_agg(c, '')
  from (
    select case when i in (5, 10) then '-'
                else substr('abcdefghijkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789',
                            1 + floor(random() * 54)::int, 1)
           end as c
    from generate_series(1, 14) i
  ) x;
$$;

create or replace function usr_criar(p_nome text, p_email text)
returns table(usuario_id uuid, senha text)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_nome  text := trim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_senha text;
  v_id    uuid := gen_random_uuid();
begin
  if not cfg_eh_admin() then
    raise exception 'Apenas administradores criam contas.';
  end if;
  if length(v_nome) < 2 then raise exception 'Informe o nome.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Já existe uma conta com o e-mail %.', v_email;
  end if;

  v_senha := usr_senha_temporaria();

  -- Conta de acesso. As colunas de texto vazio são exigidas pelo
  -- serviço de autenticação: se ficarem nulas, o login falha com um
  -- erro genérico de schema.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_senha, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', v_nome),
    '', '', '', '', '', '', '', ''
  );

  -- Vínculo do método de login, exigido para entrar por e-mail
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into usuarios (id, nome, email) values (v_id, v_nome, v_email);

  return query select v_id, v_senha;
end $$;

-- Redefinir a senha de alguém: gera outra temporária e devolve uma vez
create or replace function usr_redefinir_senha(p_usuario uuid)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare v_senha text;
begin
  if not cfg_eh_admin() then
    raise exception 'Apenas administradores redefinem senhas.';
  end if;
  if not exists (select 1 from auth.users where id = p_usuario) then
    raise exception 'Conta não encontrada.';
  end if;

  v_senha := usr_senha_temporaria();
  update auth.users
     set encrypted_password = extensions.crypt(v_senha, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_usuario;

  return v_senha;
end $$;

commit;

-- A troca da PRÓPRIA senha não passa por aqui: a tela usa o caminho
-- oficial do Supabase (PUT /auth/v1/user), que exige estar logado e
-- não depende de envio de e-mail.
