-- Login por usuário (vinicius, rafael, felipe) em vez de e-mail na UI

alter table public.hub_profiles
  add column if not exists usuario text;

update public.hub_profiles
set usuario = lower(trim(split_part(email, '@', 1)))
where usuario is null or trim(usuario) = '';

alter table public.hub_profiles
  alter column usuario set not null;

create unique index if not exists hub_profiles_usuario_lower_idx
  on public.hub_profiles (lower(usuario));

create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create or replace function public.hub_email_for_usuario(p_usuario text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.hub_profiles
  where lower(usuario) = lower(trim(p_usuario))
    and ativo = true
  limit 1;
$$;

revoke all on function public.hub_email_for_usuario(text) from public;
grant execute on function public.hub_email_for_usuario(text) to anon, authenticated;
