-- Parcelas em saídas (opcional — o app também grava em notas)
alter table public.hub_finance_investments
  add column if not exists parcelado boolean not null default false;

alter table public.hub_finance_investments
  add column if not exists qtd_parcelas int;

alter table public.hub_finance_investments
  add column if not exists parcelas_pagas int[] not null default '{}';

notify pgrst, 'reload schema';
