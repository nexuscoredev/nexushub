-- =============================================================================
-- NEXUS Hub — Foto de perfil: rode no SQL Editor se "Erro ao enviar foto"
-- ou "hub_pode_gerenciar() does not exist"
-- =============================================================================

-- Pré-requisitos (funções usadas pelo trigger e pelas policies RLS)
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
    select 1
    from public.hub_profiles p
    where p.id = auth.uid()
      and p.ativo = true
      and p.cargo in ('CEO', 'CTO', 'Administrador')
  );
$$;

alter table public.hub_profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-avatars',
  'hub-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.hub_profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.hub_pode_gerenciar() then
    return new;
  end if;
  if new.id is distinct from old.id then
    raise exception 'Alteração de id não permitida';
  end if;
  if new.email is distinct from old.email
    or new.cargo is distinct from old.cargo
    or new.usuario is distinct from old.usuario
    or new.ativo is distinct from old.ativo
  then
    raise exception 'Sem permissão para alterar este campo do perfil';
  end if;
  return new;
end;
$$;

drop trigger if exists hub_profiles_guard_self_update on public.hub_profiles;
create trigger hub_profiles_guard_self_update
  before update on public.hub_profiles
  for each row
  execute function public.hub_profiles_guard_self_update();

drop policy if exists hub_avatars_select on storage.objects;
create policy hub_avatars_select on storage.objects
  for select
  using (bucket_id = 'hub-avatars');

drop policy if exists hub_avatars_insert on storage.objects;
create policy hub_avatars_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'hub-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists hub_avatars_update on storage.objects;
create policy hub_avatars_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'hub-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'hub-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists hub_avatars_delete on storage.objects;
create policy hub_avatars_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'hub-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

select 'hub_profiles.avatar_url' as check_item, exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'hub_profiles' and column_name = 'avatar_url'
) as ok
union all
select 'bucket hub-avatars', exists (
  select 1 from storage.buckets where id = 'hub-avatars'
)
union all
select 'hub_pode_gerenciar()', exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'hub_pode_gerenciar'
);
