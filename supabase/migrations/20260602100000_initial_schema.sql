-- NEXUS Hub — schema inicial
create extension if not exists "pgcrypto";

-- Cargos permitidos (check via application + optional enum-like text)
create table public.hub_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome text not null,
  cargo text not null check (
    cargo in (
      'CEO',
      'CTO',
      'Desenvolvedor',
      'Administrador',
      'Operador',
      'Visualizador'
    )
  ),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hub_systems (
  id text primary key,
  nome text not null,
  url text not null,
  descricao text not null default '',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.hub_finance_subscriptions (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  fornecedor text,
  valor_mensal numeric(12, 2) not null,
  moeda text not null default 'BRL',
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  categoria text,
  ativo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hub_finance_investments (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12, 2) not null,
  moeda text not null default 'BRL',
  tipo text not null check (tipo in ('investimento', 'Saída')),
  responsavel text not null check (responsavel in ('Rafael', 'Vinícius')),
  status text not null default 'pago',
  data_referencia date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hub_finance_receivables (
  id uuid primary key default gen_random_uuid(),
  cliente_descricao text not null,
  valor numeric(12, 2) not null,
  moeda text not null default 'BRL',
  data_prevista date not null,
  status text not null check (status in ('pendente', 'recebido', 'atrasado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hub_profiles_updated_at
  before update on public.hub_profiles
  for each row execute function public.set_updated_at();

create trigger hub_finance_subscriptions_updated_at
  before update on public.hub_finance_subscriptions
  for each row execute function public.set_updated_at();

create trigger hub_finance_investments_updated_at
  before update on public.hub_finance_investments
  for each row execute function public.set_updated_at();

create trigger hub_finance_receivables_updated_at
  before update on public.hub_finance_receivables
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_profiles (id, email, nome, cargo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'cargo', 'Visualizador')
  )
  on conflict (id) do update set
    email = excluded.email,
    nome = coalesce(excluded.nome, hub_profiles.nome),
    cargo = coalesce(excluded.cargo, hub_profiles.cargo),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created_hub
  after insert on auth.users
  for each row execute function public.handle_new_hub_user();
