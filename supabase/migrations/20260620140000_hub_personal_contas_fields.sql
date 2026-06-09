-- Campos para gestão de contas fixas / variáveis (checklist por grupo)
alter table public.hub_personal_transactions
  add column if not exists grupo text check (
    grupo is null or grupo in ('residencial', 'carro', 'gastos_fixos', 'variaveis')
  ),
  add column if not exists pago boolean not null default false,
  add column if not exists dia_vencimento smallint check (
    dia_vencimento is null or (dia_vencimento >= 1 and dia_vencimento <= 31)
  ),
  add column if not exists ordem smallint not null default 0;

create index if not exists hub_personal_transactions_grupo_idx
  on public.hub_personal_transactions (user_id, grupo, ordem);
