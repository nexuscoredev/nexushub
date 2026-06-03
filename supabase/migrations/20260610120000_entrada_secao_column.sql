-- Fila de entrada definitiva: implantacoes (cima) | mensalidades (baixo)
alter table public.hub_finance_receivables
  add column if not exists entrada_secao text
  check (entrada_secao is null or entrada_secao in ('implantacoes', 'mensalidades'));

-- Tag antiga em notas
update public.hub_finance_receivables
set entrada_secao = 'implantacoes'
where coalesce(notas, '') ~ '#entrada:implantacoes';

update public.hub_finance_receivables
set entrada_secao = 'mensalidades'
where entrada_secao is null
  and coalesce(notas, '') ~ '#entrada:mensalidades';

-- Nome do cliente (implantação / sistema / app)
update public.hub_finance_receivables
set entrada_secao = 'implantacoes'
where entrada_secao is null
  and (
    lower(cliente_descricao) like '%implanta%'
    or lower(cliente_descricao) like '%(sistema)%'
    or lower(cliente_descricao) like '%(app)%'
  );

update public.hub_finance_receivables
set entrada_secao = 'mensalidades'
where entrada_secao is null;

alter table public.hub_finance_receivables
  alter column entrada_secao set default 'mensalidades';

alter table public.hub_finance_receivables
  alter column entrada_secao set not null;
