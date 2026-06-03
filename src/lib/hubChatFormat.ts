import type { HubChatMensagem } from '../types/hubChat';

export function formatarHoraChat(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function rotuloDiaChat(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function chaveDia(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type BlocoMensagem =
  | { tipo: 'dia'; chave: string; rotulo: string }
  | { tipo: 'msg'; mensagem: HubChatMensagem };

export function blocosMensagensComDia(mensagens: HubChatMensagem[]): BlocoMensagem[] {
  const blocos: BlocoMensagem[] = [];
  let diaAtual = '';
  for (const m of mensagens) {
    const chave = chaveDia(m.created_at);
    if (chave !== diaAtual) {
      diaAtual = chave;
      blocos.push({ tipo: 'dia', chave, rotulo: rotuloDiaChat(m.created_at) });
    }
    blocos.push({ tipo: 'msg', mensagem: m });
  }
  return blocos;
}

export function previewLista(texto: string | null | undefined, max = 72): string {
  const t = (texto ?? '').trim();
  if (!t) return 'Sem mensagens';
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function formatarPreviewLista(
  ultima: string | null,
  ultimaRemetente: string | null,
  meuId: string,
): string {
  if (!ultima) return 'Sem mensagens';
  const prefix = ultimaRemetente && ultimaRemetente === meuId ? 'Você: ' : '';
  const t = ultima.trim();
  if (t.startsWith('[Solicitação')) return `${prefix}Pedido de ajuste`;
  if (t.startsWith('📎') || t.includes('Anexo')) return `${prefix}Anexo`;
  return `${prefix}${previewLista(t, 80)}`;
}

export function formatarHoraCurta(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HUB_CHAT_PREFIXO_SOLICITACAO = '[Solicitação de ajuste no sistema]';
