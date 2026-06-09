-- Área pessoal — financeiro privado por usuário (CEO / CTO)
create table if not exists public.hub_personal_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric(12, 2) not null check (valor >= 0),
  data_referencia date not null default current_date,
  categoria text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_personal_transactions_user_date_idx
  on public.hub_personal_transactions (user_id, data_referencia desc);

alter table public.hub_personal_transactions enable row level security;

create or replace function public.hub_pode_acessar_pessoal()
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
      and p.cargo in ('CEO', 'CTO')
  );
$$;

create policy hub_personal_transactions_select on public.hub_personal_transactions
  for select to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_transactions_insert on public.hub_personal_transactions
  for insert to authenticated
  with check (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_transactions_update on public.hub_personal_transactions
  for update to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  )
  with check (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_transactions_delete on public.hub_personal_transactions
  for delete to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );
