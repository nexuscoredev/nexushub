import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, supabaseErrorMessage } from './supabase';
import type {
  HubChatConversaLista,
  HubChatMensagem,
  HubChatSystemId,
  HubChatUsuarioLista,
} from '../types/hubChat';

export const HUB_CHAT_SYSTEM_PADRAO: HubChatSystemId = 'nexus-hub';

export function hubChatTabelasIndisponiveis(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as PostgrestError).message)
      : String(err ?? '');
  return /hub_chat_|could not find|schema cache|PGRST205/i.test(msg);
}

function rpcIndisponivel(err: PostgrestError | null): boolean {
  if (!err) return false;
  const msg = `${err.message || ''} ${err.details || ''}`.toLowerCase();
  return err.code === 'PGRST202' || err.code === '42883' || msg.includes('could not find');
}

export function outroParticipanteId(
  conversa: { participant_low: string; participant_high: string },
  meuId: string,
): string {
  return conversa.participant_low === meuId ? conversa.participant_high : conversa.participant_low;
}

export async function hubChatListarUsuariosAtivos(meuId: string): Promise<HubChatUsuarioLista[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_profiles')
    .select('id, nome, cargo, email')
    .eq('ativo', true)
    .neq('id', meuId)
    .order('nome');
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubChatUsuarioLista[];
}

export async function hubChatCarregarConversas(
  systemId: HubChatSystemId = HUB_CHAT_SYSTEM_PADRAO,
): Promise<HubChatConversaLista[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;
  if (!uid) throw new Error('Sessão inválida.');

  const embedded = await supabase
    .from('hub_chat_participantes')
    .select(
      `
        conversa_id,
        last_read_at,
        hub_chat_conversas!inner (
          id,
          system_id,
          participant_low,
          participant_high,
          ultima_preview,
          ultima_em,
          ultima_remetente_id
        )
      `,
    )
    .eq('user_id', uid)
    .eq('hub_chat_conversas.system_id', systemId);

  if (embedded.error) {
    if (hubChatTabelasIndisponiveis(embedded.error)) {
      throw new Error(
        'Chat não configurado no Supabase. Rode a migration 20260612120000_hub_chat_interno.sql.',
      );
    }
    throw new Error(supabaseErrorMessage(embedded.error));
  }

  type ConvNested = {
    id: string;
    participant_low: string;
    participant_high: string;
    ultima_preview: string | null;
    ultima_em: string | null;
    ultima_remetente_id: string | null;
  };

  let list: HubChatConversaLista[] = [];
  for (const r of embedded.data ?? []) {
    const row = r as {
      conversa_id: string;
      last_read_at: string | null;
      hub_chat_conversas: ConvNested | ConvNested[] | null;
    };
    const raw = row.hub_chat_conversas;
    const c = Array.isArray(raw) ? raw[0] : raw;
    if (!c?.id) continue;
    list.push({
      id: c.id,
      participant_low: c.participant_low,
      participant_high: c.participant_high,
      ultima_preview: c.ultima_preview,
      ultima_em: c.ultima_em,
      ultima_remetente_id: c.ultima_remetente_id,
      last_read_at: row.last_read_at,
      outro_id: outroParticipanteId(c, uid),
      unread: 0,
    });
  }

  const { data: unreadRows, error: eUnread } = await supabase.rpc('hub_chat_unread_by_conversa', {
    p_system_id: systemId,
  });
  const unreadMap = new Map<string, number>();
  if (!eUnread && unreadRows) {
    for (const row of unreadRows as { conversa_id: string; unread: number }[]) {
      unreadMap.set(row.conversa_id, Number(row.unread));
    }
    for (const item of list) {
      item.unread = unreadMap.get(item.id) ?? 0;
    }
  } else {
    for (const item of list) {
      item.unread =
        item.ultima_em &&
        item.ultima_remetente_id !== uid &&
        (!item.last_read_at || new Date(item.ultima_em) > new Date(item.last_read_at))
          ? 1
          : 0;
    }
  }

  const outroIds = [...new Set(list.map((c) => c.outro_id))];
  if (outroIds.length) {
    const { data: perfis } = await supabase
      .from('hub_profiles')
      .select('id, nome, cargo, email')
      .in('id', outroIds);
    const map = new Map((perfis ?? []).map((p) => [(p as HubChatUsuarioLista).id, p as HubChatUsuarioLista]));
    list = list.map((c) => ({ ...c, outro: map.get(c.outro_id) ?? null }));
  }

  list.sort((a, b) => {
    const ta = a.ultima_em ? new Date(a.ultima_em).getTime() : 0;
    const tb = b.ultima_em ? new Date(b.ultima_em).getTime() : 0;
    return tb - ta;
  });

  return list;
}

export async function hubChatTotalNaoLidas(
  systemId: HubChatSystemId = HUB_CHAT_SYSTEM_PADRAO,
): Promise<number> {
  if (!supabase) return 0;
  const { data: rows, error } = await supabase.rpc('hub_chat_unread_by_conversa', {
    p_system_id: systemId,
  });
  if (error) {
    if (rpcIndisponivel(error) || hubChatTabelasIndisponiveis(error)) return 0;
    return 0;
  }
  if (!rows || !Array.isArray(rows)) return 0;
  let total = 0;
  for (const row of rows as { unread?: number }[]) {
    total += Number(row.unread ?? 0);
  }
  return total;
}

export async function hubChatGetOrCreateDirect(
  outroId: string,
  systemId: HubChatSystemId = HUB_CHAT_SYSTEM_PADRAO,
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.rpc('hub_chat_get_or_create_direct', {
    p_outro: outroId,
    p_system_id: systemId,
  });
  if (error) {
    if (hubChatTabelasIndisponiveis(error)) {
      throw new Error(
        'Chat não configurado no Supabase. Rode a migration 20260612120000_hub_chat_interno.sql.',
      );
    }
    throw new Error(supabaseErrorMessage(error));
  }
  if (!data) throw new Error('Não foi possível abrir a conversa.');
  return data as string;
}

export async function hubChatCarregarMensagens(conversaId: string, limite = 200): Promise<HubChatMensagem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_chat_mensagens')
    .select('id, conversa_id, remetente_id, conteudo, created_at')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw new Error(supabaseErrorMessage(error));
  return ((data ?? []) as HubChatMensagem[]).slice().reverse();
}

export async function hubChatEnviarTexto(conversaId: string, texto: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const trimmed = texto.trim();
  if (!trimmed) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão inválida.');

  const { error } = await supabase.from('hub_chat_mensagens').insert({
    conversa_id: conversaId,
    remetente_id: user.id,
    conteudo: trimmed,
  });
  if (error) {
    const msg = supabaseErrorMessage(error);
    if (/row-level security|42501/i.test(msg)) {
      throw new Error('Sem permissão para enviar. Confirme as policies do chat no Supabase.');
    }
    throw new Error(msg);
  }
}

export async function hubChatMarcarLida(conversaId: string): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  const { error } = await supabase
    .from('hub_chat_participantes')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversa_id', conversaId)
    .eq('user_id', user.id);
  if (error) throw new Error(supabaseErrorMessage(error));
}
