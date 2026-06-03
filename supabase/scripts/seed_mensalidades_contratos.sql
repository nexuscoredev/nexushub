-- Rode no SQL Editor se o seed completo falhar (tabela já com titulo, não descricao).
-- Cria contratos mensais para o KPI "Total mensalidade / mês".

insert into public.hub_finance_subscriptions (nome, fornecedor, valor_mensal, dia_vencimento, categoria, ativo, notas)
select v.nome, v.fornecedor, v.valor_mensal, v.dia_vencimento, v.categoria, true, v.notas
from (values
  ('RG Ambiental'::text, 'RG Ambiental'::text, 2000.00::numeric, 5, 'Mensalidade'::text, 'R$ 1.000 cada — Vinícius e Rafael'::text),
  ('Ligeirinho Hub'::text, 'Ligeirinho Hub'::text, 1000.00::numeric, 5, 'Mensalidade'::text, 'R$ 500 cada — Vinícius e Rafael'::text)
) as v(nome, fornecedor, valor_mensal, dia_vencimento, categoria, notas)
where not exists (
  select 1 from public.hub_finance_subscriptions s where s.nome = v.nome
);
