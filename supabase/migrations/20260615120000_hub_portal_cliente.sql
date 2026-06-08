-- NEXUS Hub — Portal do cliente (área pública /cliente)

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
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

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.hub_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique,
  email_contato text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_cliente_contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  nome text not null,
  email text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_contas_cliente_idx
  on public.hub_cliente_contas (cliente_id);

create table if not exists public.hub_cliente_processos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'em_andamento'
    check (status in ('novo', 'em_andamento', 'aguardando_cliente', 'concluido', 'pausado')),
  etapa_atual text,
  progresso_pct int not null default 0 check (progresso_pct between 0 and 100),
  visivel_cliente boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_processos_cliente_idx
  on public.hub_cliente_processos (cliente_id);

create table if not exists public.hub_cliente_contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  titulo text not null,
  descricao text,
  arquivo_url text,
  vigencia_inicio date,
  vigencia_fim date,
  visivel_cliente boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_contratos_cliente_idx
  on public.hub_cliente_contratos (cliente_id);

create table if not exists public.hub_cliente_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  autor_user_id uuid references auth.users (id) on delete set null,
  titulo text not null,
  mensagem text not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_analise', 'respondida', 'fechada')),
  resposta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_solicitacoes_cliente_idx
  on public.hub_cliente_solicitacoes (cliente_id);

-- ---------------------------------------------------------------------------
-- Helpers RLS
-- ---------------------------------------------------------------------------

create or replace function public.hub_cliente_id_for_user()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select c.cliente_id
  from public.hub_cliente_contas c
  where c.user_id = auth.uid()
    and c.ativo = true
  limit 1;
$$;

create or replace function public.hub_is_cliente_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.hub_cliente_contas c
    join public.hub_clientes cl on cl.id = c.cliente_id
    where c.user_id = auth.uid()
      and c.ativo = true
      and cl.ativo = true
  );
$$;

revoke all on function public.hub_cliente_id_for_user() from public;
grant execute on function public.hub_cliente_id_for_user() to authenticated;

revoke all on function public.hub_is_cliente_ativo() from public;
grant execute on function public.hub_is_cliente_ativo() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.hub_clientes enable row level security;
alter table public.hub_cliente_contas enable row level security;
alter table public.hub_cliente_processos enable row level security;
alter table public.hub_cliente_contratos enable row level security;
alter table public.hub_cliente_solicitacoes enable row level security;

-- Clientes: equipe gere; cliente vê o próprio
drop policy if exists hub_clientes_select on public.hub_clientes;
create policy hub_clientes_select on public.hub_clientes
  for select to authenticated
  using (
    public.hub_pode_gerenciar()
    or id = public.hub_cliente_id_for_user()
  );

drop policy if exists hub_clientes_manage on public.hub_clientes;
create policy hub_clientes_manage on public.hub_clientes
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- Contas cliente
drop policy if exists hub_cliente_contas_select on public.hub_cliente_contas;
create policy hub_cliente_contas_select on public.hub_cliente_contas
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_contas_manage on public.hub_cliente_contas;
create policy hub_cliente_contas_manage on public.hub_cliente_contas
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- Processos
drop policy if exists hub_cliente_processos_select on public.hub_cliente_processos;
create policy hub_cliente_processos_select on public.hub_cliente_processos
  for select to authenticated
  using (
    (public.hub_is_cliente_ativo() and cliente_id = public.hub_cliente_id_for_user() and visivel_cliente)
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_processos_manage on public.hub_cliente_processos;
create policy hub_cliente_processos_manage on public.hub_cliente_processos
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- Contratos
drop policy if exists hub_cliente_contratos_select on public.hub_cliente_contratos;
create policy hub_cliente_contratos_select on public.hub_cliente_contratos
  for select to authenticated
  using (
    (public.hub_is_cliente_ativo() and cliente_id = public.hub_cliente_id_for_user() and visivel_cliente)
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_contratos_manage on public.hub_cliente_contratos;
create policy hub_cliente_contratos_manage on public.hub_cliente_contratos
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- Solicitações
drop policy if exists hub_cliente_solicitacoes_select on public.hub_cliente_solicitacoes;
create policy hub_cliente_solicitacoes_select on public.hub_cliente_solicitacoes
  for select to authenticated
  using (
    (public.hub_is_cliente_ativo() and cliente_id = public.hub_cliente_id_for_user())
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_solicitacoes_insert on public.hub_cliente_solicitacoes;
create policy hub_cliente_solicitacoes_insert on public.hub_cliente_solicitacoes
  for insert to authenticated
  with check (
    public.hub_is_cliente_ativo()
    and cliente_id = public.hub_cliente_id_for_user()
    and autor_user_id = auth.uid()
  );

drop policy if exists hub_cliente_solicitacoes_manage on public.hub_cliente_solicitacoes;
create policy hub_cliente_solicitacoes_manage on public.hub_cliente_solicitacoes
  for update to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- updated_at
drop trigger if exists hub_clientes_updated_at on public.hub_clientes;
create trigger hub_clientes_updated_at
  before update on public.hub_clientes
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_contas_updated_at on public.hub_cliente_contas;
create trigger hub_cliente_contas_updated_at
  before update on public.hub_cliente_contas
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_processos_updated_at on public.hub_cliente_processos;
create trigger hub_cliente_processos_updated_at
  before update on public.hub_cliente_processos
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_contratos_updated_at on public.hub_cliente_contratos;
create trigger hub_cliente_contratos_updated_at
  before update on public.hub_cliente_contratos
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_solicitacoes_updated_at on public.hub_cliente_solicitacoes;
create trigger hub_cliente_solicitacoes_updated_at
  before update on public.hub_cliente_solicitacoes
  for each row execute function public.set_updated_at();
