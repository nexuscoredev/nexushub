-- =============================================================================
-- NEXUS Hub — Notificações in-app (equipe interna)
-- Leitura: destinatário; envio: gestão (CEO, CTO, Administrador)
-- =============================================================================

create table if not exists public.hub_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (length(trim(title)) > 0),
  check (length(trim(body)) > 0)
);

comment on column public.hub_notifications.recipient_user_id is
  'Destinatário. NULL = broadcast visível a toda a equipe ativa (uso via RPC com fan-out).';

create index if not exists hub_notifications_recipient_created_idx
  on public.hub_notifications (recipient_user_id, created_at desc)
  where recipient_user_id is not null;

create index if not exists hub_notifications_recipient_unread_idx
  on public.hub_notifications (recipient_user_id)
  where read_at is null and recipient_user_id is not null;

-- ---------------------------------------------------------------------------
-- RPC: enviar notificação (gestão) — fan-out quando destinatário omitido
-- ---------------------------------------------------------------------------
create or replace function public.hub_notifications_send(
  p_title text,
  p_body text,
  p_recipient uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_me uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_body text := trim(coalesce(p_body, ''));
  v_count integer := 0;
begin
  if v_me is null then
    raise exception 'not_authenticated';
  end if;

  if not public.hub_pode_gerenciar() then
    raise exception 'forbidden';
  end if;

  if length(v_title) = 0 or length(v_body) = 0 then
    raise exception 'invalid_payload';
  end if;

  if p_recipient is not null then
    if not exists (
      select 1 from public.hub_profiles u
      where u.id = p_recipient and u.ativo = true
    ) then
      raise exception 'recipient_not_found';
    end if;

    insert into public.hub_notifications (recipient_user_id, sender_user_id, title, body)
    values (p_recipient, v_me, v_title, v_body);
    return 1;
  end if;

  insert into public.hub_notifications (recipient_user_id, sender_user_id, title, body)
  select u.id, v_me, v_title, v_body
  from public.hub_profiles u
  where u.ativo = true;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.hub_notifications_send(text, text, uuid) from public;
grant execute on function public.hub_notifications_send(text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.hub_notifications enable row level security;

drop policy if exists hub_notifications_select_own on public.hub_notifications;
create policy hub_notifications_select_own
  on public.hub_notifications for select to authenticated
  using (
    public.hub_is_authenticated_active()
    and (
      recipient_user_id = auth.uid()
      or (
        recipient_user_id is null
        and exists (
          select 1 from public.hub_profiles p
          where p.id = auth.uid() and p.ativo = true
        )
      )
    )
  );

drop policy if exists hub_notifications_insert_gestao on public.hub_notifications;
create policy hub_notifications_insert_gestao
  on public.hub_notifications for insert to authenticated
  with check (
    public.hub_pode_gerenciar()
    and sender_user_id = auth.uid()
    and (
      recipient_user_id is null
      or exists (
        select 1 from public.hub_profiles u
        where u.id = recipient_user_id and u.ativo = true
      )
    )
  );

drop policy if exists hub_notifications_update_own_read on public.hub_notifications;
create policy hub_notifications_update_own_read
  on public.hub_notifications for update to authenticated
  using (
    public.hub_is_authenticated_active()
    and recipient_user_id = auth.uid()
  )
  with check (recipient_user_id = auth.uid());

grant select, update on public.hub_notifications to authenticated;
grant insert on public.hub_notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $pub$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hub_notifications'
  ) then
    alter publication supabase_realtime add table public.hub_notifications;
  end if;
end;
$pub$;

notify pgrst, 'reload schema';
