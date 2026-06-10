-- Jornada Ligeirinho alinhada às 4 fases do contrato (linguagem cliente)

delete from public.hub_cliente_marcos
where cliente_id in (select id from public.hub_clientes where slug = 'ligeirinho');

insert into public.hub_cliente_marcos (cliente_id, titulo, descricao, fase_ordem, status)
select c.id, v.titulo, v.descricao, v.fase_ordem, v.status
from public.hub_clientes c
cross join (
  values
    (
      'Fase 1 — Caixa e cadastros da loja',
      'Mapeamos o dia a dia da loja física e organizamos o PDV para vender com agilidade, com produtos e categorias no lugar certo.',
      1,
      'concluido'
    ),
    (
      'Fase 2 — Totem de autoatendimento',
      'Totem na loja com visual da marca Ligeirinho e combos prontos para o cliente escolher no próprio tablet.',
      2,
      'concluido'
    ),
    (
      'Fase 3 — Operação e entregas',
      'Painel da equipe para acompanhar pedidos — do recebimento à preparação, rota e entrega concluída.',
      3,
      'em_curso'
    ),
    (
      'Fase 4 — Validação e lançamento',
      'Testes finais com sua equipe, ajustes de última hora e início da operação assistida no dia a dia.',
      4,
      'pendente'
    )
) as v(titulo, descricao, fase_ordem, status)
where c.slug = 'ligeirinho';

update public.hub_cliente_processos p
set
  titulo = 'Ligeirinho Hub — operação integrada',
  descricao = 'PDV, totem, painel da equipe e ferramentas de marketing em um só lugar.',
  etapa_atual = 'Fase 3: operação e entregas',
  progresso_pct = 68
from public.hub_clientes c
where p.cliente_id = c.id
  and c.slug = 'ligeirinho'
  and p.titulo ilike '%ligeirinho%';
