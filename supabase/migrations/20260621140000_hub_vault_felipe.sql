-- Cofre: gestão + Felipe (felipe@nexustech.com)

create or replace function public.hub_pode_acessar_cofre()
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
      and (
        p.cargo in ('CEO', 'CTO', 'Administrador')
        or lower(trim(coalesce(p.email, ''))) = 'felipe@nexustech.com'
      )
  );
$$;

drop policy if exists hub_vault_config_gestao on public.hub_vault_config;
drop policy if exists hub_vault_config_cofre on public.hub_vault_config;
create policy hub_vault_config_cofre on public.hub_vault_config
  for all
  using (public.hub_pode_acessar_cofre())
  with check (public.hub_pode_acessar_cofre());

drop policy if exists hub_vault_entries_gestao on public.hub_vault_entries;
drop policy if exists hub_vault_entries_cofre on public.hub_vault_entries;
create policy hub_vault_entries_cofre on public.hub_vault_entries
  for all
  using (public.hub_pode_acessar_cofre())
  with check (public.hub_pode_acessar_cofre());

notify pgrst, 'reload schema';
