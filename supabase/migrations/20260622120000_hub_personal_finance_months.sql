-- Snapshots mensais do financeiro pessoal (pago por mês, estado isolado)
create table if not exists public.hub_personal_finance_months (
  user_id uuid not null references auth.users (id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  rows jsonb not null default '[]'::jsonb,
  saved_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

create index if not exists hub_personal_finance_months_user_idx
  on public.hub_personal_finance_months (user_id, month_key desc);

alter table public.hub_personal_finance_months enable row level security;

create policy hub_personal_finance_months_select on public.hub_personal_finance_months
  for select to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_finance_months_insert on public.hub_personal_finance_months
  for insert to authenticated
  with check (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_finance_months_update on public.hub_personal_finance_months
  for update to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  )
  with check (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );

create policy hub_personal_finance_months_delete on public.hub_personal_finance_months
  for delete to authenticated
  using (
    public.hub_pode_acessar_pessoal()
    and user_id = auth.uid()
  );
