import type { HubCliente } from './clientePortal';

export interface HubClienteRepo {
  id: string;
  cliente_id: string | null;
  label: string;
  repo_url: string;
  repo_ref: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  cliente?: HubCliente | null;
}

export interface HubJarvisThread {
  id: string;
  user_id: string;
  cliente_id: string | null;
  repo_url: string | null;
  repo_ref: string | null;
  titulo: string;
  cursor_agent_id: string | null;
  arquivado: boolean;
  created_at: string;
  updated_at: string;
  cliente?: HubCliente | null;
}

export type HubJarvisRole = 'user' | 'assistant';

export interface HubJarvisMessage {
  id: string;
  thread_id: string;
  role: HubJarvisRole;
  content: string;
  run_id: string | null;
  actions: unknown | null;
  created_at: string;
}

/** Resposta do endpoint de chat por thread. */
export interface JarvisThreadChatResponse {
  message: string;
  threadId: string;
  cursorAgentId?: string;
  configured?: boolean;
  error?: string;
}
