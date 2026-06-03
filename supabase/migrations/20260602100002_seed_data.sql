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

-- Saídas
insert into public.hub_finance_investments (descricao, valor, tipo, responsavel, status, data_referencia) values
  ('Cursor', 360.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
  ('Supabase', 160.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
  ('Felipe', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
  ('Cartão de visitas', 500.00, 'Saída', 'Rafael', 'pago', '2026-01-01'),
  ('Cursor', 110.00, 'Saída', 'Vinícius', 'pago', '2026-01-01'),
  ('Marketing', 250.00, 'Saída', 'Vinícius', 'pago', '2026-01-01');
