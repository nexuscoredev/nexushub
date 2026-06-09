-- NexusClient — jornada (marcos) e novidades para dashboard do cliente

create table if not exists public.hub_cliente_marcos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  titulo text not null,
  descricao text,
  fase_ordem int not null default 0,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_curso', 'concluido')),
  visivel_cliente boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_cliente_marcos_cliente_idx
  on public.hub_cliente_marcos (cliente_id, fase_ordem);

create table if not exists public.hub_cliente_atualizacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.hub_clientes (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'novidade'
    check (tipo in ('novidade', 'marco', 'lembrete', 'entrega')),
  publicado_em timestamptz not null default now(),
  visivel_cliente boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists hub_cliente_atualizacoes_cliente_idx
  on public.hub_cliente_atualizacoes (cliente_id, publicado_em desc);

alter table public.hub_cliente_marcos enable row level security;
alter table public.hub_cliente_atualizacoes enable row level security;

drop policy if exists hub_cliente_marcos_select on public.hub_cliente_marcos;
create policy hub_cliente_marcos_select on public.hub_cliente_marcos
  for select to authenticated
  using (
    (public.hub_is_cliente_ativo() and cliente_id = public.hub_cliente_id_for_user() and visivel_cliente)
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_marcos_manage on public.hub_cliente_marcos;
create policy hub_cliente_marcos_manage on public.hub_cliente_marcos
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

drop policy if exists hub_cliente_atualizacoes_select on public.hub_cliente_atualizacoes;
create policy hub_cliente_atualizacoes_select on public.hub_cliente_atualizacoes
  for select to authenticated
  using (
    (public.hub_is_cliente_ativo() and cliente_id = public.hub_cliente_id_for_user() and visivel_cliente)
    or public.hub_pode_gerenciar()
  );

drop policy if exists hub_cliente_atualizacoes_manage on public.hub_cliente_atualizacoes;
create policy hub_cliente_atualizacoes_manage on public.hub_cliente_atualizacoes
  for all to authenticated
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

drop trigger if exists hub_cliente_marcos_updated_at on public.hub_cliente_marcos;
create trigger hub_cliente_marcos_updated_at
  before update on public.hub_cliente_marcos
  for each row execute function public.set_updated_at();

-- Processos demo (visíveis ao cliente)
insert into public.hub_cliente_processos (cliente_id, titulo, descricao, status, etapa_atual, progresso_pct, visivel_cliente)
select c.id, 'Sistema de gestão ambiental', 'Plataforma para rotinas de coleta, equipes em campo e indicadores do dia a dia.', 'em_andamento', 'Homologação com sua equipe', 62, true
from public.hub_clientes c
where c.slug = 'rh-ambiental'
  and not exists (
    select 1 from public.hub_cliente_processos p
    where p.cliente_id = c.id and p.titulo = 'Sistema de gestão ambiental'
  );

insert into public.hub_cliente_processos (cliente_id, titulo, descricao, status, etapa_atual, progresso_pct, visivel_cliente)
select c.id, 'Hub comercial Ligeirinho', 'PDV, estoque e visão da operação em um só lugar, pensado para o ritmo da loja.', 'em_andamento', 'Ajustes finos do PDV', 48, true
from public.hub_clientes c
where c.slug = 'ligeirinho'
  and not exists (
    select 1 from public.hub_cliente_processos p
    where p.cliente_id = c.id and p.titulo = 'Hub comercial Ligeirinho'
  );

-- Jornada RG Ambiental
insert into public.hub_cliente_marcos (cliente_id, titulo, descricao, fase_ordem, status)
select c.id, v.titulo, v.descricao, v.fase_ordem, v.status
from public.hub_clientes c
cross join (
  values
    ('Conversa inicial', 'Entendemos rotinas, equipe e metas do negócio.', 1, 'concluido'),
    ('Desenho da solução', 'Definimos o que o sistema precisa entregar no dia a dia.', 2, 'concluido'),
    ('Construção', 'Estamos desenvolvendo módulos e telas sob medida.', 3, 'em_curso'),
    ('Validação com você', 'Sua equipe testa e nos dá feedback antes de ir ao ar.', 4, 'pendente'),
    ('Lançamento', 'Sistema no ar com acompanhamento da NEXUS.', 5, 'pendente')
) as v(titulo, descricao, fase_ordem, status)
where c.slug = 'rh-ambiental'
  and not exists (select 1 from public.hub_cliente_marcos m where m.cliente_id = c.id);

-- Jornada Ligeirinho
insert into public.hub_cliente_marcos (cliente_id, titulo, descricao, fase_ordem, status)
select c.id, v.titulo, v.descricao, v.fase_ordem, v.status
from public.hub_clientes c
cross join (
  values
    ('Mapeamento da loja', 'Entendemos fluxo de vendas, estoque e equipe.', 1, 'concluido'),
    ('Base do PDV', 'Estrutura principal pronta para operação.', 2, 'concluido'),
    ('Operação integrada', 'Conectando vendas, estoque e relatórios.', 3, 'em_curso'),
    ('Treinamento', 'Capacitação prática para o dia a dia.', 4, 'pendente'),
    ('Go-live', 'Abertura assistida e suporte nos primeiros dias.', 5, 'pendente')
) as v(titulo, descricao, fase_ordem, status)
where c.slug = 'ligeirinho'
  and not exists (select 1 from public.hub_cliente_marcos m where m.cliente_id = c.id);

-- Novidades demo
insert into public.hub_cliente_atualizacoes (cliente_id, titulo, mensagem, tipo, publicado_em)
select c.id, v.titulo, v.mensagem, v.tipo, v.publicado_em
from public.hub_clientes c
cross join (
  values
    ('Homologação agendada', 'Preparamos um roteiro simples para sua equipe validar as telas principais esta semana.', 'lembrete', now() - interval '1 day'),
    ('Módulo de rotas evoluiu', 'Ajustamos a visualização das coletas para ficar mais clara no celular.', 'novidade', now() - interval '4 days'),
    ('Reunião de alinhamento', 'Registramos os pontos combinados e já estamos aplicando no sistema.', 'marco', now() - interval '9 days')
) as v(titulo, mensagem, tipo, publicado_em)
where c.slug = 'rh-ambiental'
  and not exists (select 1 from public.hub_cliente_atualizacoes a where a.cliente_id = c.id);

insert into public.hub_cliente_atualizacoes (cliente_id, titulo, mensagem, tipo, publicado_em)
select c.id, v.titulo, v.mensagem, v.tipo, v.publicado_em
from public.hub_clientes c
cross join (
  values
    ('PDV em refinamento', 'Estamos polindo telas de venda com base no fluxo real da loja.', 'novidade', now() - interval '2 days'),
    ('Estoque conectado', 'Entradas e saídas já conversam com o painel de vendas.', 'marco', now() - interval '6 days'),
    ('Próximo passo: treino', 'Em breve agendamos sessão prática com sua equipe.', 'lembrete', now() - interval '11 days')
) as v(titulo, mensagem, tipo, publicado_em)
where c.slug = 'ligeirinho'
  and not exists (select 1 from public.hub_cliente_atualizacoes a where a.cliente_id = c.id);
