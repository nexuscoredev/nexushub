-- =============================================================================
-- NEXUS Hub — Chat interno 1:1 (equipe hub_profiles)
-- Paridade com RG Ambiental; isolamento futuro via system_id (default nexus-hub).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pré-requisito: helpers RLS do hub (idempotente — rode antes das policies)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table if not exists public.hub_chat_conversas (
  id uuid primary key default gen_random_uuid(),
  system_id text not null default 'nexus-hub'
    check (system_id in ('nexus-hub', 'rh-ambiental', 'ligeirinho')),
  tipo text not null default 'direct' check (tipo = 'direct'),
  participant_low uuid not null references auth.users (id) on delete cascade,
  participant_high uuid not null references auth.users (id) on delete cascade,
  ultima_preview text,
  ultima_em timestamptz,
  ultima_remetente_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_low < participant_high)
);

create unique index if not exists hub_chat_conversas_direct_pair
  on public.hub_chat_conversas (system_id, participant_low, participant_high);

create index if not exists hub_chat_conversas_system_updated_idx
  on public.hub_chat_conversas (system_id, updated_at desc);

create table if not exists public.hub_chat_participantes (
  conversa_id uuid not null references public.hub_chat_conversas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversa_id, user_id)
);

create index if not exists idx_hub_chat_participantes_user_id
  on public.hub_chat_participantes (user_id);

create table if not exists public.hub_chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.hub_chat_conversas (id) on delete cascade,
  remetente_id uuid not null references auth.users (id) on delete cascade,
  conteudo text,
  anexo_bucket text default 'hub-chat-anexos',
  anexo_path text,
  anexo_nome text,
  anexo_mime text,
  anexo_size bigint,
  created_at timestamptz not null default now(),
  check (
    (conteudo is not null and length(trim(conteudo)) > 0)
    or (anexo_path is not null and length(trim(anexo_path)) > 0)
  )
);

create index if not exists idx_hub_chat_mensagens_conversa_created
  on public.hub_chat_mensagens (conversa_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers: preview / updated_at na conversa
-- ---------------------------------------------------------------------------
create or replace function public.hub_chat_on_new_message_bump_conversa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preview text;
begin
  if new.conteudo is not null and length(trim(new.conteudo)) > 0 then
    v_preview := left(trim(new.conteudo), 240);
  elsif new.anexo_nome is not null and length(trim(new.anexo_nome)) > 0 then
    v_preview := '📎 ' || left(trim(new.anexo_nome), 200);
  else
    v_preview := 'Anexo';
  end if;

  update public.hub_chat_conversas
  set
    ultima_preview = v_preview,
    ultima_em = new.created_at,
    ultima_remetente_id = new.remetente_id,
    updated_at = now()
  where id = new.conversa_id;

  return new;
end;
$$;

drop trigger if exists trg_hub_chat_mensagens_bump_conversa on public.hub_chat_mensagens;
create trigger trg_hub_chat_mensagens_bump_conversa
  after insert on public.hub_chat_mensagens
  for each row
  execute function public.hub_chat_on_new_message_bump_conversa();

-- ---------------------------------------------------------------------------
-- Helpers RLS (sem recursão)
-- ---------------------------------------------------------------------------
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

create or replace function public.hub_chat_ordered_participant_pair(p_a uuid, p_b uuid)
returns table (participant_low uuid, participant_high uuid)
language sql
stable
security definer
set search_path = public
as $$
  select
    case when p_a < p_b then p_a else p_b end,
    case when p_a < p_b then p_b else p_a end;
$$;

revoke all on function public.hub_chat_ordered_participant_pair(uuid, uuid) from public;
grant execute on function public.hub_chat_ordered_participant_pair(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: conversa directa + não lidas
-- ---------------------------------------------------------------------------
create or replace function public.hub_chat_get_or_create_direct(
  p_outro uuid,
  p_system_id text default 'nexus-hub'
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_me uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_id uuid;
  v_system text := coalesce(nullif(trim(p_system_id), ''), 'nexus-hub');
begin
  if v_me is null then
    raise exception 'not_authenticated';
  end if;
  if p_outro is null or p_outro = v_me then
    raise exception 'invalid_peer';
  end if;
  if v_system not in ('nexus-hub', 'rh-ambiental', 'ligeirinho') then
    raise exception 'invalid_system_id';
  end if;

  if not public.hub_is_authenticated_active() then
    raise exception 'inactive_user';
  end if;

  if not exists (
    select 1 from public.hub_profiles u
    where u.id = p_outro and u.ativo = true
  ) then
    raise exception 'peer_not_found';
  end if;

  if p_outro < v_me then
    v_low := p_outro;
    v_high := v_me;
  else
    v_low := v_me;
    v_high := p_outro;
  end if;

  insert into public.hub_chat_conversas (system_id, participant_low, participant_high)
  values (v_system, v_low, v_high)
  on conflict (system_id, participant_low, participant_high) do update
  set updated_at = now()
  returning id into v_id;

  insert into public.hub_chat_participantes (conversa_id, user_id)
  values (v_id, v_low), (v_id, v_high)
  on conflict do nothing;

  return v_id;
end;
$$;

revoke all on function public.hub_chat_get_or_create_direct(uuid, text) from public;
grant execute on function public.hub_chat_get_or_create_direct(uuid, text) to authenticated;

create or replace function public.hub_chat_unread_by_conversa(p_system_id text default 'nexus-hub')
returns table (conversa_id uuid, unread bigint)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    m.conversa_id,
    count(*)::bigint as unread
  from public.hub_chat_mensagens m
  inner join public.hub_chat_participantes cp
    on cp.conversa_id = m.conversa_id
   and cp.user_id = auth.uid()
  inner join public.hub_chat_conversas c
    on c.id = m.conversa_id
   and c.system_id = coalesce(nullif(trim(p_system_id), ''), 'nexus-hub')
  where m.remetente_id is distinct from auth.uid()
    and m.created_at > coalesce(cp.last_read_at, '-infinity'::timestamptz)
  group by m.conversa_id;
$$;

revoke all on function public.hub_chat_unread_by_conversa(text) from public;
grant execute on function public.hub_chat_unread_by_conversa(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.hub_chat_conversas enable row level security;
alter table public.hub_chat_participantes enable row level security;
alter table public.hub_chat_mensagens enable row level security;

drop policy if exists hub_chat_conversas_select on public.hub_chat_conversas;
create policy hub_chat_conversas_select
  on public.hub_chat_conversas for select to authenticated
  using (
    public.hub_is_authenticated_active()
    and public.hub_is_chat_participant(id)
  );

drop policy if exists hub_chat_participantes_select on public.hub_chat_participantes;
create policy hub_chat_participantes_select
  on public.hub_chat_participantes for select to authenticated
  using (
    public.hub_is_authenticated_active()
    and public.hub_is_chat_participant(conversa_id)
  );

drop policy if exists hub_chat_participantes_update_own_read on public.hub_chat_participantes;
create policy hub_chat_participantes_update_own_read
  on public.hub_chat_participantes for update to authenticated
  using (
    public.hub_is_authenticated_active()
    and user_id = auth.uid()
  )
  with check (user_id = auth.uid());

drop policy if exists hub_chat_mensagens_select on public.hub_chat_mensagens;
create policy hub_chat_mensagens_select
  on public.hub_chat_mensagens for select to authenticated
  using (
    public.hub_is_authenticated_active()
    and public.hub_is_chat_participant(conversa_id)
  );

drop policy if exists hub_chat_mensagens_insert on public.hub_chat_mensagens;
create policy hub_chat_mensagens_insert
  on public.hub_chat_mensagens for insert to authenticated
  with check (
    public.hub_is_authenticated_active()
    and remetente_id = auth.uid()
    and public.hub_is_chat_participant(conversa_id)
  );

grant select on public.hub_chat_conversas to authenticated;
grant select, update on public.hub_chat_participantes to authenticated;
grant select, insert on public.hub_chat_mensagens to authenticated;

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
      and tablename = 'hub_chat_mensagens'
  ) then
    alter publication supabase_realtime add table public.hub_chat_mensagens;
  end if;
end;
$pub$;

-- ---------------------------------------------------------------------------
-- Storage: hub-chat-anexos (privado)
-- ---------------------------------------------------------------------------
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
