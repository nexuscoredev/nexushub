-- =============================================================================
-- CORREÇÃO: rodar no SQL Editor do nexushub se falhou em hub_is_authenticated_active()
-- 1) Cria funções base do hub (se faltarem)
-- 2) Garante hub_is_chat_participant (se o script parou antes)
-- 3) Recria policies do bucket hub-chat-anexos
-- =============================================================================

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

create or replace function public.hub_is_chat_participant(p_conversa uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.hub_chat_participantes cp
    where cp.conversa_id = p_conversa
      and cp.user_id = auth.uid()
  );
$$;

revoke all on function public.hub_is_chat_participant(uuid) from public;
grant execute on function public.hub_is_chat_participant(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-chat-anexos',
  'hub-chat-anexos',
  false,
  15728640,
  null
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists hub_chat_anexos_select on storage.objects;
create policy hub_chat_anexos_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'hub-chat-anexos'
    and public.hub_is_authenticated_active()
    and public.hub_is_chat_participant((split_part(name, '/', 1))::uuid)
  );

drop policy if exists hub_chat_anexos_insert on storage.objects;
create policy hub_chat_anexos_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'hub-chat-anexos'
    and public.hub_is_authenticated_active()
    and public.hub_is_chat_participant((split_part(name, '/', 1))::uuid)
  );

drop policy if exists hub_chat_anexos_update on storage.objects;
create policy hub_chat_anexos_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'hub-chat-anexos'
    and public.hub_is_authenticated_active()
    and public.hub_is_chat_participant((split_part(name, '/', 1))::uuid)
  );

drop policy if exists hub_chat_anexos_delete on storage.objects;
create policy hub_chat_anexos_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'hub-chat-anexos'
    and public.hub_is_authenticated_active()
    and public.hub_is_chat_participant((split_part(name, '/', 1))::uuid)
  );
