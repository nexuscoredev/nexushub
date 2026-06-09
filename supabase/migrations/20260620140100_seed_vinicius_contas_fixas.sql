-- Contas pessoais do Vinícius (somente vinicius@nexustech.com)
insert into public.hub_personal_transactions (
  user_id,
  tipo,
  descricao,
  valor,
  data_referencia,
  categoria,
  notas,
  grupo,
  pago,
  dia_vencimento,
  ordem
)
select
  p.id,
  v.tipo,
  v.descricao,
  v.valor,
  current_date,
  v.categoria,
  v.notas,
  v.grupo,
  v.pago,
  v.dia_vencimento,
  v.ordem
from public.hub_profiles p
cross join (
  values
    ('saida', 'Condomínio', 744::numeric, 'moradia', null::text, 'residencial', true, null::smallint, 1::smallint),
    ('saida', 'Apartamento', 1520, 'moradia', null, 'residencial', true, null, 2),
    ('saida', 'Luz', 219, 'moradia', null, 'residencial', true, null, 3),
    ('saida', 'Internet', 102, 'moradia', null, 'residencial', true, null, 4),
    ('saida', 'Parcela do Carro', 1717, 'transporte', 'Stellantis', 'carro', true, 15, 1),
    ('saida', 'Seguro', 0, 'transporte', 'Nubank', 'carro', true, null, 2),
    ('saida', 'IPVA', 630, 'transporte', 'Detran', 'carro', true, null, 3),
    ('saida', 'Gasolina', 0, 'transporte', 'Mercado Pago', 'carro', true, null, 4),
    ('saida', 'Sem parar', 0, 'transporte', 'Mercado Pago', 'carro', true, null, 5),
    ('saida', 'Faculdade da Mayara', 380, 'educacao', null, 'gastos_fixos', true, null, 1),
    ('saida', 'Contabilidade', 140, 'outras', null, 'gastos_fixos', true, null, 2),
    ('saida', 'Internet Móvel', 76, 'outras', null, 'gastos_fixos', true, null, 3),
    ('saida', 'Barbearia', 0, 'outras', 'Nubank', 'gastos_fixos', true, null, 4),
    ('saida', 'Mercado', 0, 'alimentacao', 'VR', 'gastos_fixos', true, null, 5),
    ('saida', 'Vinícius e Mayara', 1912.59, 'outras', 'Mercado Pago', 'variaveis', true, null, 1),
    ('saida', 'Vinícius', 4152.38, 'outras', 'Nubank', 'variaveis', true, null, 2),
    ('saida', 'Mayara', 1549.67, 'outras', 'Nubank', 'variaveis', true, null, 3)
) as v(tipo, descricao, valor, categoria, notas, grupo, pago, dia_vencimento, ordem)
where lower(p.email) = 'vinicius@nexustech.com'
  and not exists (
    select 1
    from public.hub_personal_transactions t
    where t.user_id = p.id
      and t.grupo is not null
  );
