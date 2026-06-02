-- RLS — NEXUS Hub
alter table public.hub_profiles enable row level security;
alter table public.hub_systems enable row level security;
alter table public.hub_finance_subscriptions enable row level security;
alter table public.hub_finance_investments enable row level security;
alter table public.hub_finance_receivables enable row level security;

create or replace function public.hub_current_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
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

-- hub_profiles
create policy hub_profiles_select on public.hub_profiles
  for select to authenticated
  using (public.hub_is_authenticated_active());

create policy hub_profiles_update_self on public.hub_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy hub_profiles_manage on public.hub_profiles
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- hub_systems (read all active; manage gestão)
create policy hub_systems_select on public.hub_systems
  for select to authenticated
  using (public.hub_is_authenticated_active() and ativo = true);

create policy hub_systems_manage on public.hub_systems
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

-- financeiro (somente sócios)
create policy hub_finance_subscriptions_all on public.hub_finance_subscriptions
  for all to authenticated
  using (public.hub_pode_acessar_financeiro())
  with check (public.hub_pode_acessar_financeiro());

create policy hub_finance_investments_all on public.hub_finance_investments
  for all to authenticated
  using (public.hub_pode_acessar_financeiro())
  with check (public.hub_pode_acessar_financeiro());

create policy hub_finance_receivables_all on public.hub_finance_receivables
  for all to authenticated
  using (public.hub_pode_acessar_financeiro())
  with check (public.hub_pode_acessar_financeiro());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
