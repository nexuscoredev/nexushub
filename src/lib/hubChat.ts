import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, supabaseErrorMessage } from './supabase';
import { HUB_CHAT_PREFIXO_SOLICITACAO } from './hubChatFormat';
import type {
  HubChatConversaLista,
  HubChatMensagem,
  HubChatSolicitacaoFilaItem,
  HubChatSystemId,
  HubChatUsuarioLista,
} from '../types/hubChat';

export const HUB_CHAT_SYSTEM_PADRAO: HubChatSystemId = 'nexus-hub';
const BUCKET_ANEXOS = 'hub-chat-anexos';

function sanitizarNomeFicheiro(nome: string): string {
  return nome.replace(/[^\w.\-()\s\u00C0-\u024F]/gi, '_').slice(0, 180) || 'ficheiro';
}

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
    .select(
      'id, conversa_id, remetente_id, conteudo, anexo_bucket, anexo_path, anexo_nome, anexo_mime, anexo_size, created_at',
    )
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

export async function hubChatObterLastReadAt(
  conversaId: string,
  userId: string,
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('hub_chat_participantes')
    .select('last_read_at')
    .eq('conversa_id', conversaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(supabaseErrorMessage(error));
  return data?.last_read_at ?? null;
}

export function hubChatMensagemLidaPeloOutro(
  createdAt: string,
  outroLastReadAt: string | null | undefined,
): boolean {
  if (!outroLastReadAt) return false;
  return new Date(outroLastReadAt).getTime() >= new Date(createdAt).getTime();
}

export async function hubChatEnviarAnexo(
  conversaId: string,
  ficheiro: File,
  legendaOpcional?: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão inválida.');

  const path = `${conversaId}/${crypto.randomUUID()}_${sanitizarNomeFicheiro(ficheiro.name)}`;
  const { error: upErr } = await supabase.storage.from(BUCKET_ANEXOS).upload(path, ficheiro, {
    cacheControl: '3600',
    upsert: false,
    contentType: ficheiro.type || undefined,
  });
  if (upErr) throw new Error(supabaseErrorMessage(upErr));

  const legenda = legendaOpcional?.trim() ?? '';
  const { error } = await supabase.from('hub_chat_mensagens').insert({
    conversa_id: conversaId,
    remetente_id: user.id,
    conteudo: legenda || null,
    anexo_bucket: BUCKET_ANEXOS,
    anexo_path: path,
    anexo_nome: ficheiro.name,
    anexo_mime: ficheiro.type || null,
    anexo_size: ficheiro.size,
  });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function hubChatUrlAssinadaAnexo(path: string, segundos = 3600): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET_ANEXOS).createSignedUrl(path, segundos);
  if (error) {
    console.error(error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Pedidos de ajuste detectados por prefixo na mensagem (paridade RG sem tabela extra). */
export async function hubChatListarSolicitacoesFila(
  meuId: string,
): Promise<HubChatSolicitacaoFilaItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_chat_mensagens')
    .select('id, conversa_id, remetente_id, conteudo, created_at')
    .ilike('conteudo', `${HUB_CHAT_PREFIXO_SOLICITACAO}%`)
    .neq('remetente_id', meuId)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) {
    if (hubChatTabelasIndisponiveis(error)) return [];
    throw new Error(supabaseErrorMessage(error));
  }
  const rows = data ?? [];
  if (!rows.length) return [];

  const remetenteIds = [...new Set(rows.map((r) => (r as { remetente_id: string }).remetente_id))];
  const { data: perfis } = await supabase
    .from('hub_profiles')
    .select('id, nome, email')
    .in('id', remetenteIds);
  const nomes = new Map(
    (perfis ?? []).map((p) => {
      const row = p as { id: string; nome: string; email: string };
      return [row.id, row.nome?.trim() || row.email] as const;
    }),
  );

  return rows.map((r) => {
    const row = r as {
      id: string;
      conversa_id: string;
      remetente_id: string;
      conteudo: string | null;
      created_at: string;
    };
    const corpo = (row.conteudo ?? '').replace(HUB_CHAT_PREFIXO_SOLICITACAO, '').trim();
    const linhas = corpo.split('\n').filter(Boolean);
    const preview = linhas.find((l) => !l.startsWith('Página:') && !l.startsWith('—')) ?? corpo;
    return {
      mensagem_id: row.id,
      conversa_id: row.conversa_id,
      remetente_id: row.remetente_id,
      solicitante_nome: nomes.get(row.remetente_id) ?? 'Utilizador',
      preview: preview.slice(0, 120),
      created_at: row.created_at,
    };
  });
}

export function hubChatMensagemEhSolicitacao(conteudo: string | null): boolean {
  return Boolean(conteudo?.trim().startsWith(HUB_CHAT_PREFIXO_SOLICITACAO));
}

export async function hubChatEnviarSolicitacaoSistema(texto: string, destinoId: string): Promise<string> {
  const trimmed = texto.trim();
  if (!trimmed) throw new Error('Descreva a solicitação antes de enviar.');
  const conversaId = await hubChatGetOrCreateDirect(destinoId);
  const pagina =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '';
  const corpo = `${HUB_CHAT_PREFIXO_SOLICITACAO}\n\n${trimmed}\n\nPágina: ${pagina || '—'}`;
  await hubChatEnviarTexto(conversaId, corpo);
  return conversaId;
}
