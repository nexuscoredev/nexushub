-- Cofre: troca Stripe por Outlook nos provedores

update public.hub_vault_entries
set provedor = 'outlook'
where provedor = 'stripe';

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
      'outlook',
      'notion',
      'slack',
      'microsoft',
      'todoist',
      'docker',
      'npm',
      'outro'
    )
  );
