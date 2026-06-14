-- Quadro branco nativo do Painel de Desenvolvimento (equipe NEXUS)
create table if not exists public.hub_dev_whiteboard (
  board_id text primary key,
  scene jsonb not null default '{"version":1,"viewport":{"panX":0,"panY":0,"zoom":1},"elements":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.hub_dev_whiteboard enable row level security;

create policy hub_dev_whiteboard_select on public.hub_dev_whiteboard
  for select to authenticated
  using (public.hub_is_authenticated_active());

create policy hub_dev_whiteboard_write on public.hub_dev_whiteboard
  for insert to authenticated
  with check (public.hub_is_authenticated_active());

create policy hub_dev_whiteboard_update on public.hub_dev_whiteboard
  for update to authenticated
  using (public.hub_is_authenticated_active())
  with check (public.hub_is_authenticated_active());

insert into public.hub_dev_whiteboard (board_id)
values ('nexus-equipe')
on conflict (board_id) do nothing;

alter table public.hub_dev_whiteboard replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.hub_dev_whiteboard;
exception
  when duplicate_object then null;
end $$;
