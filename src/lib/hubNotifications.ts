import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, supabaseErrorMessage } from './supabase';
import type { HubNotification, HubNotificationLista } from '../types/hubNotifications';
import type { HubProfile } from '../types/database';

export function hubNotificationsIndisponiveis(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as PostgrestError).message)
      : String(err ?? '');
  return /hub_notifications|could not find|schema cache|PGRST205/i.test(msg);
}

export async function hubNotificationsListar(limite = 50): Promise<HubNotificationLista[]> {
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from('hub_notifications')
    .select('id, recipient_user_id, sender_user_id, title, body, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) {
    if (hubNotificationsIndisponiveis(error)) {
      throw new Error(
        'Notificações não configuradas no Supabase. Rode a migration 20260624120000_hub_notifications.sql.',
      );
    }
    throw new Error(supabaseErrorMessage(error));
  }

  const rows = (data ?? []) as HubNotification[];
  if (!rows.length) return [];

  const senderIds = [...new Set(rows.map((r) => r.sender_user_id))];
  const { data: perfis } = await supabase
    .from('hub_profiles')
    .select('id, nome, cargo')
    .in('id', senderIds);

  const senders = new Map(
    (perfis ?? []).map((p) => {
      const row = p as Pick<HubProfile, 'id' | 'nome' | 'cargo'>;
      return [row.id, row] as const;
    }),
  );

  return rows.map((row) => ({
    ...row,
    sender: senders.get(row.sender_user_id) ?? null,
  }));
}

export async function hubNotificationsContarNaoLidas(): Promise<number> {
  if (!supabase) return 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return 0;

  const { count, error } = await supabase
    .from('hub_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', user.id)
    .is('read_at', null);

  if (error) {
    if (hubNotificationsIndisponiveis(error)) return 0;
    return 0;
  }

  return count ?? 0;
}

export async function hubNotificationsMarcarLida(id: string): Promise<void> {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  const { error } = await supabase
    .from('hub_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_user_id', user.id)
    .is('read_at', null);

  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function hubNotificationsMarcarTodasLidas(): Promise<void> {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  const { error } = await supabase
    .from('hub_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_user_id', user.id)
    .is('read_at', null);

  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function hubNotificationsEnviar(
  titulo: string,
  corpo: string,
  destinatarioId?: string | null,
): Promise<number> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const title = titulo.trim();
  const body = corpo.trim();
  if (!title || !body) throw new Error('Título e mensagem são obrigatórios.');

  const { data, error } = await supabase.rpc('hub_notifications_send', {
    p_title: title,
    p_body: body,
    p_recipient: destinatarioId ?? null,
  });

  if (error) {
    if (hubNotificationsIndisponiveis(error)) {
      throw new Error(
        'Notificações não configuradas no Supabase. Rode a migration 20260624120000_hub_notifications.sql.',
      );
    }
    const msg = supabaseErrorMessage(error);
    if (/forbidden|42501/i.test(msg)) {
      throw new Error('Sem permissão para enviar notificações.');
    }
    throw new Error(msg);
  }

  return Number(data ?? 0);
}

export async function hubNotificationsListarDestinatarios(): Promise<
  Pick<HubProfile, 'id' | 'nome' | 'cargo' | 'email'>[]
> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('hub_profiles')
    .select('id, nome, cargo, email')
    .eq('ativo', true)
    .order('nome');

  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as Pick<HubProfile, 'id' | 'nome' | 'cargo' | 'email'>[];
}
