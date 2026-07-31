-- Visão macro do financeiro pessoal (aba Total) — dívidas, a receber, assinaturas

create table if not exists public.hub_personal_finance_macro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria text not null check (
    categoria in ('divida_atual', 'divida_recorrente', 'a_receber', 'assinatura')
  ),
  titulo text not null,
  valor_mensal numeric(12, 2) check (valor_mensal is null or valor_mensal >= 0),
  saldo_restante numeric(12, 2) check (saldo_restante is null or saldo_restante >= 0),
  parcelas_restantes smallint check (parcelas_restantes is null or parcelas_restantes >= 0),
  notas text,
  ordem smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_personal_finance_macro_user_id_idx
  on public.hub_personal_finance_macro (user_id);

create index if not exists hub_personal_finance_macro_user_categoria_idx
  on public.hub_personal_finance_macro (user_id, categoria, ordem);

alter table public.hub_personal_finance_macro enable row level security;

create policy hub_personal_finance_macro_select on public.hub_personal_finance_macro
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_finance_macro_insert on public.hub_personal_finance_macro
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_finance_macro_update on public.hub_personal_finance_macro
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_finance_macro_delete on public.hub_personal_finance_macro
  for delete to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());
