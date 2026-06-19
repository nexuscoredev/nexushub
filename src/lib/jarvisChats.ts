import { supabase, supabaseErrorMessage } from './supabase';
import type { HubCliente } from '../types/clientePortal';
import type {
  HubClienteRepo,
  HubJarvisMessage,
  HubJarvisThread,
} from '../types/jarvisChat';

function client() {
  if (!supabase) throw new Error('Supabase não configurado');
  return supabase;
}

export async function listJarvisThreads(): Promise<HubJarvisThread[]> {
  const { data, error } = await client()
    .from('hub_jarvis_threads')
    .select('*, cliente:hub_clientes(id, nome, slug, email_contato, ativo)')
    .eq('arquivado', false)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubJarvisThread[];
}

export async function createJarvisThread(input: {
  userId: string;
  clienteId?: string | null;
  repoUrl?: string | null;
  repoRef?: string | null;
  titulo?: string;
}): Promise<HubJarvisThread> {
  const { data, error } = await client()
    .from('hub_jarvis_threads')
    .insert({
      user_id: input.userId,
      cliente_id: input.clienteId ?? null,
      repo_url: input.repoUrl ?? null,
      repo_ref: input.repoRef ?? 'main',
      titulo: input.titulo?.trim() || 'Nova conversa',
    })
    .select('*, cliente:hub_clientes(id, nome, slug, email_contato, ativo)')
    .single();
  if (error) throw new Error(supabaseErrorMessage(error));
  return data as HubJarvisThread;
}

export async function archiveJarvisThread(id: string): Promise<void> {
  const { error } = await client()
    .from('hub_jarvis_threads')
    .update({ arquivado: true })
    .eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deleteJarvisThread(id: string): Promise<void> {
  const { error } = await client().from('hub_jarvis_threads').delete().eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function renameJarvisThread(id: string, titulo: string): Promise<void> {
  const { error } = await client()
    .from('hub_jarvis_threads')
    .update({ titulo: titulo.trim() || 'Nova conversa' })
    .eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function listJarvisMessages(threadId: string): Promise<HubJarvisMessage[]> {
  const { data, error } = await client()
    .from('hub_jarvis_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubJarvisMessage[];
}

export async function listClientes(): Promise<HubCliente[]> {
  const { data, error } = await client()
    .from('hub_clientes')
    .select('id, nome, slug, email_contato, ativo')
    .eq('ativo', true)
    .order('nome', { ascending: true });
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubCliente[];
}

export async function listClienteRepos(clienteId?: string | null): Promise<HubClienteRepo[]> {
  let query = client()
    .from('hub_cliente_repos')
    .select('*, cliente:hub_clientes(id, nome, slug, email_contato, ativo)')
    .eq('ativo', true)
    .order('label', { ascending: true });
  if (clienteId) query = query.eq('cliente_id', clienteId);
  const { data, error } = await query;
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubClienteRepo[];
}

export async function createClienteRepo(input: {
  clienteId: string | null;
  label: string;
  repoUrl: string;
  repoRef?: string;
}): Promise<HubClienteRepo> {
  const { data, error } = await client()
    .from('hub_cliente_repos')
    .insert({
      cliente_id: input.clienteId,
      label: input.label.trim(),
      repo_url: input.repoUrl.trim(),
      repo_ref: input.repoRef?.trim() || 'main',
    })
    .select('*, cliente:hub_clientes(id, nome, slug, email_contato, ativo)')
    .single();
  if (error) throw new Error(supabaseErrorMessage(error));
  return data as HubClienteRepo;
}

export async function deleteClienteRepo(id: string): Promise<void> {
  const { error } = await client().from('hub_cliente_repos').delete().eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}
