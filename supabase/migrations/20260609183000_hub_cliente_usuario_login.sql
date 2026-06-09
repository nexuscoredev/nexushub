-- NexusClient — login por usuário (rgambiental, ligeirinho, …)

alter table public.hub_cliente_contas
  add column if not exists usuario text;

update public.hub_cliente_contas
set usuario = lower(trim(split_part(email, '@', 1)))
where usuario is null or trim(usuario) = '';

create unique index if not exists hub_cliente_contas_usuario_lower_idx
  on public.hub_cliente_contas (lower(usuario))
  where usuario is not null and trim(usuario) <> '';

create or replace function public.hub_email_for_cliente_usuario(p_usuario text)
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select c.email
  from public.hub_cliente_contas c
  join public.hub_clientes cl on cl.id = c.cliente_id
  where lower(c.usuario) = lower(trim(p_usuario))
    and c.ativo = true
    and cl.ativo = true
  limit 1;
$$;

revoke all on function public.hub_email_for_cliente_usuario(text) from public;
grant execute on function public.hub_email_for_cliente_usuario(text) to anon, authenticated;

-- Contas NexusClient não devem gerar perfil de equipe no Hub
create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'tipo', '') = 'cliente' then
    return new;
  end if;

  insert into public.hub_profiles (id, email, nome, cargo, usuario)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'cargo', 'Visualizador'),
    lower(coalesce(
      new.raw_user_meta_data ->> 'usuario',
      split_part(new.email, '@', 1)
    ))
  )
  on conflict (id) do update set
    email = excluded.email,
    nome = coalesce(excluded.nome, hub_profiles.nome),
    cargo = coalesce(excluded.cargo, hub_profiles.cargo),
    usuario = coalesce(excluded.usuario, hub_profiles.usuario),
    updated_at = now();
  return new;
end;
$$;
