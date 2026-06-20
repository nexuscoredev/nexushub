-- Área pessoal — preferências e mídia sincronizadas por usuário (multi-dispositivo)

create or replace function public.hub_usuario_ativo()
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
  );
$$;

create table if not exists public.hub_personal_app_layout (
  user_id uuid primary key references auth.users (id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_personal_drinks_carta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_personal_adega (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hub_personal_app_layout enable row level security;
alter table public.hub_personal_drinks_carta enable row level security;
alter table public.hub_personal_adega enable row level security;

create policy hub_personal_app_layout_select on public.hub_personal_app_layout
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_app_layout_insert on public.hub_personal_app_layout
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_app_layout_update on public.hub_personal_app_layout
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_drinks_carta_select on public.hub_personal_drinks_carta
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_drinks_carta_insert on public.hub_personal_drinks_carta
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_drinks_carta_update on public.hub_personal_drinks_carta
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_adega_select on public.hub_personal_adega
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_adega_insert on public.hub_personal_adega
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_adega_update on public.hub_personal_adega
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-personal-media',
  'hub-personal-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists hub_personal_media_select on storage.objects;
create policy hub_personal_media_select on storage.objects
  for select
  using (bucket_id = 'hub-personal-media');

drop policy if exists hub_personal_media_insert on storage.objects;
create policy hub_personal_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'hub-personal-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists hub_personal_media_update on storage.objects;
create policy hub_personal_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'hub-personal-media'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'hub-personal-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists hub_personal_media_delete on storage.objects;
create policy hub_personal_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'hub-personal-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );
