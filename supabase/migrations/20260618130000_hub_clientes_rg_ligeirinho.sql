-- Clientes NEXUS para cofre, portal e financeiro

insert into public.hub_clientes (nome, slug, ativo)
values
  ('RG Ambiental', 'rh-ambiental', true),
  ('Ligeirinho', 'ligeirinho', true)
on conflict (slug) do update
set
  nome = excluded.nome,
  ativo = excluded.ativo,
  updated_at = now();
