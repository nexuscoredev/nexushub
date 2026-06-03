-- =============================================================================
-- NEXUS Hub — NÃO rode 20260602100000_initial_schema.sql se hub_profiles já existe.
-- Use este script: diagnóstico + só o que falta (idempotente).
-- =============================================================================

-- ---------- 1) Diagnóstico (só leitura) ----------
select 'hub_profiles' as objeto, exists (
  select 1 from pg_tables where schemaname = 'public' and tablename = 'hub_profiles'
) as ok
union all
select 'hub_is_authenticated_active()', exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'hub_is_authenticated_active'
)
union all
select 'hub_chat_conversas', exists (
  select 1 from pg_tables where schemaname = 'public' and tablename = 'hub_chat_conversas'
)
union all
select 'hub-chat-anexos bucket', exists (
  select 1 from storage.buckets where id = 'hub-chat-anexos'
);

-- ---------- 2) Funções RLS do hub (se faltarem) ----------
create or replace function public.hub_current_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.hub_is_authenticated_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hub_profiles p
    where p.id = auth.uid() and p.ativo = true
  );
$$;

create or replace function public.hub_pode_gerenciar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hub_profiles p
    where p.id = auth.uid()
      and p.ativo = true
      and p.cargo in ('CEO', 'CTO', 'Administrador')
  );
$$;

create or replace function public.hub_pode_acessar_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.hub_current_email() in (
    'vinicius@nexustech.com',
    'rafael@nexustech.com'
  );
$$;

-- ---------- 3) Coluna usuario (login por usuário) — idempotente ----------
alter table public.hub_profiles
  add column if not exists usuario text;

update public.hub_profiles
set usuario = lower(trim(split_part(email, '@', 1)))
where usuario is null or trim(usuario) = '';

create unique index if not exists hub_profiles_usuario_lower_idx
  on public.hub_profiles (lower(usuario));

-- Trigger auth → hub_profiles (replace; não recria tabela)
create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_profiles (id, email, nome, cargo, usuario)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'cargo', 'Visualizador'),
    lower(coalesce(
      new.raw_user_meta_data ->> 'usuario',
      split_part(new.email, '@', 1)
    ))
  )
  on conflict (id) do update set
    email = excluded.email,
    nome = coalesce(excluded.nome, hub_profiles.nome),
    cargo = coalesce(excluded.cargo, hub_profiles.cargo),
    usuario = coalesce(excluded.usuario, hub_profiles.usuario),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_hub on auth.users;
create trigger on_auth_user_created_hub
  after insert on auth.users
  for each row execute function public.handle_new_hub_user();

-- ---------- 4) Chat — só se tabelas ainda não existirem: rode o arquivo completo
--     supabase/migrations/20260612120000_hub_chat_interno.sql
--     OU supabase/scripts/hub_chat_fix_prereqs_and_storage.sql (se chat já existe, só storage)
