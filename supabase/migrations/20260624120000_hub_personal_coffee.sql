-- Café pessoal — estoque de cápsulas/grãos e carta de receitas

create table if not exists public.hub_personal_coffee_stock (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_personal_coffee_carta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hub_personal_coffee_stock enable row level security;
alter table public.hub_personal_coffee_carta enable row level security;

create policy hub_personal_coffee_stock_select on public.hub_personal_coffee_stock
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_coffee_stock_insert on public.hub_personal_coffee_stock
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_coffee_stock_update on public.hub_personal_coffee_stock
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_coffee_carta_select on public.hub_personal_coffee_carta
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_coffee_carta_insert on public.hub_personal_coffee_carta
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_coffee_carta_update on public.hub_personal_coffee_carta
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());
