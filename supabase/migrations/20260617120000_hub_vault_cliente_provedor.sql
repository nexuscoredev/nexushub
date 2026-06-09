-- Cofre: vínculo com cliente do portal + provedor (Vercel, Supabase, etc.)

alter table public.hub_vault_entries
  add column if not exists cliente_id uuid references public.hub_clientes (id) on delete set null;

alter table public.hub_vault_entries
  add column if not exists provedor text;

alter table public.hub_vault_entries
  drop constraint if exists hub_vault_entries_provedor_check;

alter table public.hub_vault_entries
  add constraint hub_vault_entries_provedor_check check (
    provedor is null
    or provedor in (
      'vercel',
      'supabase',
      'github',
      'gmail',
      'google',
      'aws',
      'cloudflare',
      'stripe',
      'notion',
      'slack',
      'microsoft',
      'todoist',
      'docker',
      'npm',
      'outro'
    )
  );

create index if not exists hub_vault_entries_cliente_idx
  on public.hub_vault_entries (cliente_id);

create index if not exists hub_vault_entries_provedor_idx
  on public.hub_vault_entries (provedor);

notify pgrst, 'reload schema';
