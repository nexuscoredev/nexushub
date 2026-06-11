-- Permite excluir snapshots de quadro salvos pela equipe
create policy hub_dev_whiteboard_snapshots_delete on public.hub_dev_whiteboard_snapshots
  for delete to authenticated
  using (public.hub_is_authenticated_active());
