-- JARVIS — chats estilo Cursor: threads por cliente/repo, mensagens persistidas e
-- repos vinculados a cada cliente. Acesso para cargos CEO / CTO / Desenvolvedor.

-- Permissão: quem pode usar o JARVIS
create or replace function public.hub_pode_usar_jarvis()
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
      and p.cargo in ('CEO', 'CTO', 'Desenvolvedor')
  );
$$;

-- Repos que o JARVIS pode abrir, por cliente
create table if not exists public.hub_cliente_repos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.hub_clientes (id) on delete cascade,
  label text not null,
  repo_url text not null,
  repo_ref text not null default 'main',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_repos_cliente_idx
  on public.hub_cliente_repos (cliente_id);

alter table public.hub_cliente_repos enable row level security;

create policy hub_cliente_repos_select on public.hub_cliente_repos
  for select to authenticated
  using (public.hub_pode_usar_jarvis());

create policy hub_cliente_repos_insert on public.hub_cliente_repos
  for insert to authenticated
  with check (public.hub_pode_usar_jarvis());

create policy hub_cliente_repos_update on public.hub_cliente_repos
  for update to authenticated
  using (public.hub_pode_usar_jarvis())
  with check (public.hub_pode_usar_jarvis());

create policy hub_cliente_repos_delete on public.hub_cliente_repos
  for delete to authenticated
  using (public.hub_pode_usar_jarvis());

-- Threads (= conversas do Cursor). Cada uma aponta para um Cloud Agent.
create table if not exists public.hub_jarvis_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cliente_id uuid references public.hub_clientes (id) on delete set null,
  repo_url text,
  repo_ref text default 'main',
  titulo text not null default 'Nova conversa',
  cursor_agent_id text,
  arquivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_jarvis_threads_user_idx
  on public.hub_jarvis_threads (user_id, updated_at desc);

alter table public.hub_jarvis_threads enable row level security;

create policy hub_jarvis_threads_select on public.hub_jarvis_threads
  for select to authenticated
  using (public.hub_pode_usar_jarvis() and user_id = auth.uid());

create policy hub_jarvis_threads_insert on public.hub_jarvis_threads
  for insert to authenticated
  with check (public.hub_pode_usar_jarvis() and user_id = auth.uid());

create policy hub_jarvis_threads_update on public.hub_jarvis_threads
  for update to authenticated
  using (public.hub_pode_usar_jarvis() and user_id = auth.uid())
  with check (public.hub_pode_usar_jarvis() and user_id = auth.uid());

create policy hub_jarvis_threads_delete on public.hub_jarvis_threads
  for delete to authenticated
  using (public.hub_pode_usar_jarvis() and user_id = auth.uid());

-- Mensagens de cada thread
create table if not exists public.hub_jarvis_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.hub_jarvis_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  run_id text,
  actions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hub_jarvis_messages_thread_idx
  on public.hub_jarvis_messages (thread_id, created_at asc);

alter table public.hub_jarvis_messages enable row level security;

create policy hub_jarvis_messages_select on public.hub_jarvis_messages
  for select to authenticated
  using (
    public.hub_pode_usar_jarvis()
    and exists (
      select 1 from public.hub_jarvis_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy hub_jarvis_messages_insert on public.hub_jarvis_messages
  for insert to authenticated
  with check (
    public.hub_pode_usar_jarvis()
    and exists (
      select 1 from public.hub_jarvis_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy hub_jarvis_messages_delete on public.hub_jarvis_messages
  for delete to authenticated
  using (
    public.hub_pode_usar_jarvis()
    and exists (
      select 1 from public.hub_jarvis_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );
