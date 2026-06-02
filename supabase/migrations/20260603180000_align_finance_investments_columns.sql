-- Alinha hub_finance_investments ao schema em produção (titulo, data_investimento)
-- Idempotente: só renomeia se ainda existir o layout antigo do repo.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'descricao'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'titulo'
  ) then
    alter table public.hub_finance_investments rename column descricao to titulo;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'data_referencia'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'data_investimento'
  ) then
    alter table public.hub_finance_investments rename column data_referencia to data_investimento;
  end if;
end $$;
