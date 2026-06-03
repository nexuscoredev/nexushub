-- Classificação para filas Entrada / Saída no financeiro
-- PRÉ-REQUISITO: tabelas criadas em 20260602100000_initial_schema.sql
-- (e, se o app usar titulo/data_investimento, rodar antes 20260603180000_align_finance_investments_columns.sql)

do $guard$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'hub_finance_receivables'
  ) then
    raise exception
      'Tabela hub_finance_receivables não existe. No SQL Editor, execute nesta ordem: 20260602100000_initial_schema.sql → 20260602100001_rls_policies.sql → 20260602100002_seed_data.sql → (demais migrations) → este arquivo.';
  end if;
end
$guard$;

alter table public.hub_finance_receivables
  add column if not exists categoria text;

alter table public.hub_finance_investments
  add column if not exists categoria text;

update public.hub_finance_receivables
set categoria = 'implantacao'
where categoria is null
  and lower(cliente_descricao) like '%implanta%';

update public.hub_finance_receivables
set categoria = 'mensalidade'
where categoria is null;

-- titulo existe após align; descricao só no schema inicial
do $backfill$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'titulo'
  ) then
    update public.hub_finance_investments
    set categoria = 'assinatura'
    where categoria is null
      and tipo = 'Saída'
      and lower(titulo) in ('cursor', 'supabase');

    update public.hub_finance_investments
    set categoria = 'transporte'
    where categoria is null
      and tipo = 'Saída'
      and lower(titulo) like '%transport%';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'descricao'
  ) then
    update public.hub_finance_investments
    set categoria = 'assinatura'
    where categoria is null
      and tipo = 'Saída'
      and lower(descricao) in ('cursor', 'supabase');

    update public.hub_finance_investments
    set categoria = 'transporte'
    where categoria is null
      and tipo = 'Saída'
      and lower(descricao) like '%transport%';
  end if;
end
$backfill$;

update public.hub_finance_investments
set categoria = 'outras'
where categoria is null
  and tipo in ('Saída', 'investimento');
