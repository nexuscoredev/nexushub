-- Contrato Ligeirinho Hub visível no Nexus Client (seção Documentos)

insert into public.hub_cliente_contratos (
  cliente_id,
  titulo,
  descricao,
  arquivo_url,
  vigencia_inicio,
  visivel_cliente
)
select
  c.id,
  'Contrato Executivo V8 — Ligeirinho Hub',
  'Prestação de serviços e engenharia de software. Investimento R$ 15.000,00 + mensalidade R$ 1.000,00 após Go-Live.',
  '/cliente/documentacao/ligeirinho-contrato',
  '2024-05-22'::date,
  true
from public.hub_clientes c
where c.slug = 'ligeirinho'
  and not exists (
    select 1
    from public.hub_cliente_contratos h
    where h.cliente_id = c.id
      and h.titulo = 'Contrato Executivo V8 — Ligeirinho Hub'
  );
