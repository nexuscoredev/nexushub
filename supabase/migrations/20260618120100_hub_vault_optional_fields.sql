-- Cofre: título e senha opcionais

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.hub_vault_entries'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%titulo%'
      and pg_get_constraintdef(c.oid) ilike '%length%'
  loop
    execute format('alter table public.hub_vault_entries drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.hub_vault_entries
  alter column password_iv drop not null,
  alter column password_ciphertext drop not null;

alter table public.hub_vault_entries
  add constraint hub_vault_entries_password_pair_check
  check (
    (password_ciphertext is null and password_iv is null)
    or (password_ciphertext is not null and password_iv is not null)
  );
