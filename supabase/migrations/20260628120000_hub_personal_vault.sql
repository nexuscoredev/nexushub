-- Cofre de senhas pessoal (área /pessoal) — uma config e entradas por usuário

create table if not exists public.hub_personal_vault_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kdf_salt text not null,
  verifier_iv text not null,
  verifier_ciphertext text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_personal_vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  usuario_login text,
  url text,
  categoria text not null default 'outro',
  password_iv text,
  password_ciphertext text,
  notas_iv text,
  notas_ciphertext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_personal_vault_entries_password_pair_check check (
    (password_ciphertext is null and password_iv is null)
    or (password_ciphertext is not null and password_iv is not null)
  ),
  constraint hub_personal_vault_entries_notas_pair_check check (
    (notas_ciphertext is null and notas_iv is null)
    or (notas_ciphertext is not null and notas_iv is not null)
  )
);

create index if not exists hub_personal_vault_entries_user_id_idx
  on public.hub_personal_vault_entries (user_id);

alter table public.hub_personal_vault_config enable row level security;
alter table public.hub_personal_vault_entries enable row level security;

create policy hub_personal_vault_config_select on public.hub_personal_vault_config
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_config_insert on public.hub_personal_vault_config
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_config_update on public.hub_personal_vault_config
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_config_delete on public.hub_personal_vault_config
  for delete to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_entries_select on public.hub_personal_vault_entries
  for select to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_entries_insert on public.hub_personal_vault_entries
  for insert to authenticated
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_entries_update on public.hub_personal_vault_entries
  for update to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid())
  with check (public.hub_usuario_ativo() and user_id = auth.uid());

create policy hub_personal_vault_entries_delete on public.hub_personal_vault_entries
  for delete to authenticated
  using (public.hub_usuario_ativo() and user_id = auth.uid());
