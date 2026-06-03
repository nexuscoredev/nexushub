-- Seed sistemas NEXUS
insert into public.hub_systems (id, nome, url, descricao, ordem) values
  ('rh-ambiental', 'RG Ambiental', 'https://rh-ambiental-sistema.vercel.app', 'Coleta de resíduos e gestão ambiental.', 1),
  ('ligeirinho', 'Ligeirinho Hub', 'https://ligeirinhohub.vercel.app', 'PDV, operação, fiscal', 2),
  ('contabil', 'Contábil Hub', 'https://contabil-hub.vercel.app', 'Gestão contábil', 3)
on conflict (id) do update set
  nome = excluded.nome,
  url = excluded.url,
  descricao = excluded.descricao,
  ordem = excluded.ordem;

-- Assinaturas mensais (vencimento dia 5)
insert into public.hub_finance_subscriptions (nome, fornecedor, valor_mensal, dia_vencimento, categoria, notas) values
  ('RG Ambiental', 'RG Ambiental', 2000.00, 5, 'Mensalidade', 'R$ 1.000 cada — Vinícius e Rafael'),
  ('Ligeirinho', 'Ligeirinho Hub', 1000.00, 5, 'Mensalidade', 'R$ 500 cada — Vinícius e Rafael')
on conflict do nothing;

-- Entradas (recebido)
insert into public.hub_finance_receivables (cliente_descricao, valor, data_prevista, status, notas) values
  ('LigeirinhoHub implantação', 3000.00, '2026-05-26', 'recebido', 'R$ 1.500 cada — Vinícius e Rafael'),
  ('RG Ambiental (Sistema)', 1500.00, '2026-06-05', 'recebido', '100% Vinícius'),
  ('RG Ambiental (App)', 5000.00, '2026-06-05', 'recebido', 'R$ 2.500 cada — Vinícius e Rafael'),
  ('LigeirinhoHub implantação', 3000.00, '2026-06-10', 'recebido', 'R$ 1.500 cada — Vinícius e Rafael');

-- Saídas (titulo/data_investimento após 20260603180000, ou descricao/data_referencia no schema inicial)
do $seed_saidas$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'titulo'
  ) then
    insert into public.hub_finance_investments (titulo, valor, tipo, responsavel, status, data_investimento)
    select v.titulo, v.valor, v.tipo, v.responsavel, v.status, v.data_investimento
    from (values
      ('Cursor', 360.00::numeric, 'Saída', 'Rafael', 'pago', '2026-01-01'::date),
      ('Supabase', 160.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Felipe', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Cartão de visitas', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Cursor', 110.00, 'Saída', 'Vinícius', 'pago', '2026-01-01'),
      ('Marketing', 250.00, 'Saída', 'Vinícius', 'pago', '2026-01-01')
    ) as v(titulo, valor, tipo, responsavel, status, data_investimento)
    where not exists (
      select 1 from public.hub_finance_investments i
      where i.titulo = v.titulo and i.responsavel = v.responsavel and i.valor = v.valor
    );
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hub_finance_investments'
      and column_name = 'descricao'
  ) then
    insert into public.hub_finance_investments (descricao, valor, tipo, responsavel, status, data_referencia)
    select v.descricao, v.valor, v.tipo, v.responsavel, v.status, v.data_referencia
    from (values
      ('Cursor', 360.00::numeric, 'Saída', 'Rafael', 'pago', '2026-01-01'::date),
      ('Supabase', 160.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Felipe', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Cartão de visitas', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
      ('Cursor', 110.00, 'Saída', 'Vinícius', 'pago', '2026-01-01'),
      ('Marketing', 250.00, 'Saída', 'Vinícius', 'pago', '2026-01-01')
    ) as v(descricao, valor, tipo, responsavel, status, data_referencia)
    where not exists (
      select 1 from public.hub_finance_investments i
      where i.descricao = v.descricao and i.responsavel = v.responsavel and i.valor = v.valor
    );
  end if;
end
$seed_saidas$;
