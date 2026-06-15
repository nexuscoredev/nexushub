import type { Session } from '@supabase/supabase-js';
import { hubChatTabelasIndisponiveis } from './hubChat';
import { supabase, supabaseConfigured, supabaseErrorMessage } from './supabase';
import type { HubProfile, HubSystem } from '../types/database';

export type HealthStatus = 'ok' | 'warn' | 'error';

export interface HealthCheck {
  id: string;
  label: string;
  detail: string;
  status: HealthStatus;
}

export interface HubEcosystemHealth {
  checks: HealthCheck[];
  refreshedAt: string;
}

async function countTable(
  table: string,
  filter?: { column: string; value: boolean },
): Promise<{ count: number | null; error: unknown | null }> {
  if (!supabase) return { count: null, error: new Error('Supabase não configurado') };

  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  return { count: count ?? null, error };
}

async function checkTodoist(): Promise<HealthCheck> {
  try {
    const res = await fetch('/api/todoist/projects');
    const data = (await res.json()) as { configured?: boolean; projects?: unknown[]; error?: string };
    if (!res.ok && data.error) {
      return {
        id: 'todoist',
        label: 'Todoist (Fila)',
        detail: data.error,
        status: 'error',
      };
    }
    if (!data.configured) {
      return {
        id: 'todoist',
        label: 'Todoist (Fila)',
        detail: 'não configurado no servidor',
        status: 'warn',
      };
    }
    const total = Array.isArray(data.projects) ? data.projects.length : 0;
    return {
      id: 'todoist',
      label: 'Todoist (Fila)',
      detail: `conectado · ${total} projetos`,
      status: 'ok',
    };
  } catch {
    return {
      id: 'todoist',
      label: 'Todoist (Fila)',
      detail: 'falha ao verificar',
      status: 'warn',
    };
  }
}

export async function loadHubEcosystemHealth(options: {
  session: Session | null;
  profile: HubProfile | null;
}): Promise<HubEcosystemHealth> {
  const checks: HealthCheck[] = [];

  if (!supabaseConfigured || !supabase) {
    checks.push({
      id: 'supabase',
      label: 'Supabase',
      detail: 'variáveis VITE_SUPABASE ausentes',
      status: 'error',
    });
  } else {
    const { error } = await supabase.from('hub_systems').select('id', { head: true, count: 'exact' });
    checks.push({
      id: 'supabase',
      label: 'Supabase',
      detail: error ? supabaseErrorMessage(error) : 'conectado',
      status: error ? 'error' : 'ok',
    });
  }

  checks.push({
    id: 'auth',
    label: 'Sessão Auth',
    detail: options.session ? 'ativa' : 'expirada',
    status: options.session ? 'ok' : 'error',
  });

  checks.push({
    id: 'profile',
    label: 'Perfil Hub',
    detail: options.profile ? `${options.profile.cargo} · ativo` : 'indisponível',
    status: options.profile ? 'ok' : 'warn',
  });

  const [systems, users, clients, chatResult] = await Promise.all([
    countTable('hub_systems', { column: 'ativo', value: true }),
    countTable('hub_profiles', { column: 'ativo', value: true }),
    countTable('hub_clientes', { column: 'ativo', value: true }),
    supabase
      ? supabase.from('hub_chat_conversas').select('id', { head: true, count: 'exact' }).limit(1)
      : Promise.resolve({ count: null, error: new Error('Supabase não configurado') }),
  ]);

  checks.push({
    id: 'systems',
    label: 'Sistemas cadastrados',
    detail: systems.error
      ? supabaseErrorMessage(systems.error)
      : `${systems.count ?? 0} ativos`,
    status: systems.error ? 'error' : 'ok',
  });

  checks.push({
    id: 'users',
    label: 'Usuários equipe',
    detail: users.error
      ? supabaseErrorMessage(users.error)
      : `${users.count ?? 0} ativos`,
    status: users.error ? 'error' : 'ok',
  });

  checks.push({
    id: 'clients',
    label: 'Clientes portal',
    detail: clients.error
      ? supabaseErrorMessage(clients.error)
      : `${clients.count ?? 0} ativos`,
    status: clients.error ? 'warn' : 'ok',
  });

  const chatErr = chatResult.error;
  checks.push({
    id: 'chat',
    label: 'Chat interno',
    detail: chatErr
      ? hubChatTabelasIndisponiveis(chatErr)
        ? 'migration pendente'
        : supabaseErrorMessage(chatErr)
      : 'disponível',
    status: chatErr ? (hubChatTabelasIndisponiveis(chatErr) ? 'warn' : 'error') : 'ok',
  });

  checks.push(await checkTodoist());

  return {
    checks,
    refreshedAt: new Date().toISOString(),
  };
}

export async function loadSystemHealth(
  system: HubSystem,
  accessToken?: string | null,
): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  checks.push({
    id: 'registry',
    label: 'Cadastro Hub',
    detail: system.ativo ? 'ativo em hub_systems' : 'marcado como inativo',
    status: system.ativo ? 'ok' : 'error',
  });

  const url = system.url?.trim();
  if (!url) {
    checks.push({
      id: 'url',
      label: 'URL de produção',
      detail: 'não configurada',
      status: 'error',
    });
  } else {
    checks.push({
      id: 'url',
      label: 'URL de produção',
      detail: url,
      status: 'ok',
    });

    if (accessToken) {
      try {
        const res = await fetch(`/api/hub/system-ping?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = (await res.json()) as {
          reachable?: boolean;
          status?: number;
          error?: string;
        };
        if (!res.ok) {
          checks.push({
            id: 'reachability',
            label: 'Disponibilidade',
            detail: data.error ?? 'falha ao verificar',
            status: 'error',
          });
        } else if (data.reachable) {
          checks.push({
            id: 'reachability',
            label: 'Disponibilidade',
            detail: typeof data.status === 'number' ? `online · HTTP ${data.status}` : 'online',
            status: 'ok',
          });
        } else {
          checks.push({
            id: 'reachability',
            label: 'Disponibilidade',
            detail: data.error ?? `offline${data.status ? ` · HTTP ${data.status}` : ''}`,
            status: 'error',
          });
        }
      } catch {
        checks.push({
          id: 'reachability',
          label: 'Disponibilidade',
          detail: 'falha ao verificar',
          status: 'warn',
        });
      }
    } else {
      checks.push({
        id: 'reachability',
        label: 'Disponibilidade',
        detail: 'sessão necessária para testar',
        status: 'warn',
      });
    }
  }

  if (system.id === 'ligeirinho') {
    checks.push({
      id: 'ligeirinho-stack',
      label: 'Stack Ligeirinho',
      detail: 'PDV, Totem, Operacional — cadastro GF no Supabase do produto',
      status: 'ok',
    });
  }

  if (system.id === 'rh-ambiental') {
    checks.push({
      id: 'rg-stack',
      label: 'Stack RG Ambiental',
      detail: 'App de coleta e gestão ambiental em produção',
      status: 'ok',
    });
  }

  return checks;
}
