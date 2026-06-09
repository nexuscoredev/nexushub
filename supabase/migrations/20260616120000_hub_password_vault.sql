-- =============================================================================
-- NEXUS Hub — Cofre de senhas (ciphertext no banco; chave só no cliente)
-- Acesso: gestão (CEO, CTO, Administrador)
-- =============================================================================

create or replace function public.hub_pode_gerenciar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_profiles p
    where p.id = auth.uid()
      and p.ativo = true
      and p.cargo in ('CEO', 'CTO', 'Administrador')
  );
$$;

-- Configuração global do cofre (salt KDF + verificador criptografado)
create table if not exists public.hub_vault_config (
  id smallint primary key default 1 check (id = 1),
  kdf_salt text not null,
  verifier_iv text not null,
  verifier_ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Credenciais (senha e notas sensíveis em ciphertext)
create table if not exists public.hub_vault_entries (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  usuario_login text,
  url text,
  categoria text not null default 'outro'
    check (categoria in ('infra', 'saas', 'cliente', 'banco', 'email', 'outro')),
  system_id text references public.hub_systems (id) on delete set null,
  password_iv text not null,
  password_ciphertext text not null,
  notas_iv text,
  notas_ciphertext text,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(titulo)) > 0),
  check (
    (notas_ciphertext is null and notas_iv is null)
    or (notas_ciphertext is not null and notas_iv is not null)
  )
);

create index if not exists hub_vault_entries_titulo_idx
  on public.hub_vault_entries (titulo);

create index if not exists hub_vault_entries_categoria_idx
  on public.hub_vault_entries (categoria);

drop trigger if exists hub_vault_config_updated_at on public.hub_vault_config;
create trigger hub_vault_config_updated_at
  before update on public.hub_vault_config
  for each row execute function public.set_updated_at();

drop trigger if exists hub_vault_entries_updated_at on public.hub_vault_entries;
create trigger hub_vault_entries_updated_at
  before update on public.hub_vault_entries
  for each row execute function public.set_updated_at();

alter table public.hub_vault_config enable row level security;
alter table public.hub_vault_entries enable row level security;

drop policy if exists hub_vault_config_gestao on public.hub_vault_config;
create policy hub_vault_config_gestao on public.hub_vault_config
  for all
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

drop policy if exists hub_vault_entries_gestao on public.hub_vault_entries;
create policy hub_vault_entries_gestao on public.hub_vault_entries
  for all
  using (public.hub_pode_gerenciar())
  with check (public.hub_pode_gerenciar());

grant select, insert, update, delete on public.hub_vault_config to authenticated;
grant select, insert, update, delete on public.hub_vault_entries to authenticated;

notify pgrst, 'reload schema';
