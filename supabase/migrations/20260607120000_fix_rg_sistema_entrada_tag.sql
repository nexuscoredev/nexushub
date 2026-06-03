-- Corrige fila em notas: implantação (ex. RG Ambiental sistema) não fica em mensalidades
update public.hub_finance_receivables
set notas = regexp_replace(
  coalesce(notas, ''),
  '^#entrada:mensalidades',
  '#entrada:implantacoes'
)
where lower(cliente_descricao) like '%implanta%'
   or lower(cliente_descricao) like '%(sistema)%';
