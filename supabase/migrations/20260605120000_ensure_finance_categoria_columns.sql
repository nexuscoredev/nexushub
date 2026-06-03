-- Opcional: coluna categoria para relatórios SQL (o app não depende dela)
alter table public.hub_finance_receivables
  add column if not exists categoria text;

alter table public.hub_finance_investments
  add column if not exists categoria text;

notify pgrst, 'reload schema';
