-- RG Ambiental (App) e demais implantações de app ficam em Implantações, não Mensalidades
update public.hub_finance_receivables
set notas = regexp_replace(
  coalesce(notas, ''),
  '^#entrada:mensalidades',
  '#entrada:implantacoes'
)
where lower(cliente_descricao) like '%(app)%';

update public.hub_finance_receivables
set categoria = 'implantacao'
where lower(cliente_descricao) like '%(app)%'
  and coalesce(categoria, '') not in ('implantacao', 'implantações');
