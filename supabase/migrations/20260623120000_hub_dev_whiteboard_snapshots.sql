-- Histórico de quadros salvos para a equipe (Painel Dev)
create table if not exists public.hub_dev_whiteboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_id text not null default 'nexus-equipe',
  title text not null,
  scene jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists hub_dev_whiteboard_snapshots_board_created_idx
  on public.hub_dev_whiteboard_snapshots (board_id, created_at desc);

alter table public.hub_dev_whiteboard_snapshots enable row level security;

create policy hub_dev_whiteboard_snapshots_select on public.hub_dev_whiteboard_snapshots
  for select to authenticated
  using (public.hub_is_authenticated_active());

create policy hub_dev_whiteboard_snapshots_insert on public.hub_dev_whiteboard_snapshots
  for insert to authenticated
  with check (public.hub_is_authenticated_active());

alter table public.hub_dev_whiteboard_snapshots replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.hub_dev_whiteboard_snapshots;
exception
  when duplicate_object then null;
end $$;
