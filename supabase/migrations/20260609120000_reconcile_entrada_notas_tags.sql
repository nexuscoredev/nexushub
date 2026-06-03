-- Corrige tags #entrada nas notas: implantação em cima, mensalidade embaixo

update public.hub_finance_receivables
set notas = regexp_replace(
  coalesce(notas, ''),
  '^#entrada:mensalidades',
  '#entrada:implantacoes'
)
where lower(cliente_descricao) like '%implanta%'
   or lower(cliente_descricao) like '%(sistema)%'
   or lower(cliente_descricao) like '%(app)%';

update public.hub_finance_receivables
set notas = case
  when coalesce(notas, '') ~ '^#entrada:' then notas
  else '#entrada:mensalidades ' || coalesce(notas, '')
end
where lower(cliente_descricao) not like '%implanta%'
  and lower(cliente_descricao) not like '%(sistema)%'
  and lower(cliente_descricao) not like '%(app)%'
  and coalesce(notas, '') !~ '^#entrada:';
