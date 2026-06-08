import type {
  HubClienteContrato,
  HubClienteConta,
  HubClienteProcesso,
  HubClienteSolicitacao,
} from '../types/clientePortal';
import { supabase, supabaseErrorMessage } from './supabase';

function portalIndisponivel(err: unknown): boolean {
  const msg = supabaseErrorMessage(err).toLowerCase();
  return /hub_cliente_|could not find|schema cache|pgrst205/i.test(msg);
}

export async function fetchClienteConta(userId: string): Promise<HubClienteConta | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('hub_cliente_contas')
    .select('*, cliente:hub_clientes(id, nome, slug, email_contato, ativo)')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();
  if (error) {
    if (portalIndisponivel(error)) return null;
    throw error;
  }
  return data as HubClienteConta | null;
}

export async function listarProcessosCliente(clienteId: string): Promise<HubClienteProcesso[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_cliente_processos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('visivel_cliente', true)
    .order('updated_at', { ascending: false });
  if (error) {
    if (portalIndisponivel(error)) {
      throw new Error(
        'Portal do cliente não configurado. Rode a migration 20260615120000_hub_portal_cliente.sql.',
      );
    }
    throw new Error(supabaseErrorMessage(error));
  }
  return (data ?? []) as HubClienteProcesso[];
}

export async function listarContratosCliente(clienteId: string): Promise<HubClienteContrato[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_cliente_contratos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('visivel_cliente', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubClienteContrato[];
}

export async function listarSolicitacoesCliente(clienteId: string): Promise<HubClienteSolicitacao[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_cliente_solicitacoes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubClienteSolicitacao[];
}

export async function criarSolicitacaoCliente(
  clienteId: string,
  userId: string,
  titulo: string,
  mensagem: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('hub_cliente_solicitacoes').insert({
    cliente_id: clienteId,
    autor_user_id: userId,
    titulo: titulo.trim(),
    mensagem: mensagem.trim(),
    status: 'aberta',
  });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export const PROCESSO_STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando você',
  concluido: 'Concluído',
  pausado: 'Pausado',
};

export const SOLICITACAO_STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  respondida: 'Respondida',
  fechada: 'Fechada',
};
