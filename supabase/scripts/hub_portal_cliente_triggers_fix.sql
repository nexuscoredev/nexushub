-- Rode se a migration do portal falhou com: set_updated_at() does not exist
-- Depois pode reexecutar o final da migration ou só estes triggers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hub_clientes_updated_at on public.hub_clientes;
create trigger hub_clientes_updated_at
  before update on public.hub_clientes
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_contas_updated_at on public.hub_cliente_contas;
create trigger hub_cliente_contas_updated_at
  before update on public.hub_cliente_contas
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_processos_updated_at on public.hub_cliente_processos;
create trigger hub_cliente_processos_updated_at
  before update on public.hub_cliente_processos
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_contratos_updated_at on public.hub_cliente_contratos;
create trigger hub_cliente_contratos_updated_at
  before update on public.hub_cliente_contratos
  for each row execute function public.set_updated_at();

drop trigger if exists hub_cliente_solicitacoes_updated_at on public.hub_cliente_solicitacoes;
create trigger hub_cliente_solicitacoes_updated_at
  before update on public.hub_cliente_solicitacoes
  for each row execute function public.set_updated_at();
