import type { HubFinanceInvestment, HubFinanceReceivable } from '../types/database';

export type FinanceTable =
  | 'hub_finance_receivables'
  | 'hub_finance_subscriptions'
  | 'hub_finance_investments';

export type FinanceFluxo = 'entrada' | 'saida';

export type EntradaSecao = 'implantacoes' | 'mensalidades';

export type SaidaSecao = 'assinaturas' | 'transporte' | 'outras';

export type FinanceFluxoSecao =
  | { fluxo: 'entrada'; secao: EntradaSecao }
  | { fluxo: 'saida'; secao: SaidaSecao };

export const ENTRADA_SECOES: { id: EntradaSecao; label: string }[] = [
  { id: 'implantacoes', label: 'Implantações' },
  { id: 'mensalidades', label: 'Mensalidades' },
];

export const SAIDA_SECOES: { id: SaidaSecao; label: string }[] = [
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'outras', label: 'Outras despesas da empresa' },
];

const ENTRADA_TAG_RE = /^#entrada:(implantacoes|mensalidades)\s*/;
const SAIDA_TAG_RE = /^#saida:(assinaturas|transporte|outras)\s*/;

/** Remove marcador interno de fila — só para exibição/edição. */
export function stripFluxoTag(notas: string | null | undefined): string {
  return (notas ?? '').replace(ENTRADA_TAG_RE, '').replace(SAIDA_TAG_RE, '').trim();
}

export function withEntradaTag(
  secao: EntradaSecao,
  notas: string | null | undefined,
): string {
  const body = stripFluxoTag(notas);
  return body ? `#entrada:${secao} ${body}` : `#entrada:${secao}`;
}

export function withSaidaTag(secao: SaidaSecao, notas: string | null | undefined): string {
  const body = stripFluxoTag(notas);
  return body ? `#saida:${secao} ${body}` : `#saida:${secao}`;
}

function readEntradaSecaoFromNotas(notas: string | null | undefined): EntradaSecao | null {
  const m = notas?.match(/^#entrada:(implantacoes|mensalidades)/);
  return m ? (m[1] as EntradaSecao) : null;
}

/** Sugestão pelo nome do cliente (quando não há tag de arraste/salvamento). */
export function inferEntradaSecaoFromCliente(clienteDescricao: string): EntradaSecao | null {
  const d = clienteDescricao.toLowerCase();
  if (d.includes('implanta') || d.includes('(sistema)') || d.includes('(app)')) {
    return 'implantacoes';
  }
  if (d.includes('mensal')) {
    return 'mensalidades';
  }
  return null;
}

function readSaidaSecaoFromNotas(notas: string | null | undefined): SaidaSecao | null {
  const m = notas?.match(/^#saida:(assinaturas|transporte|outras)/);
  return m ? (m[1] as SaidaSecao) : null;
}

export function secaoEntradaReceivable(r: HubFinanceReceivable): EntradaSecao {
  const fromTag = readEntradaSecaoFromNotas(r.notas);
  if (fromTag) return fromTag;

  const fromCliente = inferEntradaSecaoFromCliente(r.cliente_descricao);
  if (fromCliente) return fromCliente;

  const cat = (r.categoria ?? '').toLowerCase();
  if (cat === 'implantacao' || cat === 'implantações') return 'implantacoes';
  if (cat === 'mensalidade' || cat === 'mensalidades') return 'mensalidades';

  return 'mensalidades';
}

export function secaoSaidaInvestment(i: HubFinanceInvestment): SaidaSecao {
  const fromTag = readSaidaSecaoFromNotas(i.notas);
  if (fromTag) return fromTag;
  const cat = (i.categoria ?? '').toLowerCase();
  if (cat === 'assinatura' || cat === 'assinaturas') return 'assinaturas';
  if (cat === 'transporte') return 'transporte';
  if (cat === 'outras') return 'outras';
  const t = i.titulo.toLowerCase();
  if (t.includes('cursor') || t.includes('supabase')) return 'assinaturas';
  if (t.includes('transport')) return 'transporte';
  if (i.tipo === 'investimento') return 'outras';
  return 'outras';
}

/** Colunas que o app envia ao Supabase (sem categoria em receivables/investments). */
export const FINANCE_PAYLOAD_KEYS: Record<FinanceTable, readonly string[]> = {
  hub_finance_receivables: [
    'cliente_descricao',
    'valor',
    'data_prevista',
    'status',
    'notas',
  ],
  hub_finance_subscriptions: [
    'nome',
    'valor_mensal',
    'dia_vencimento',
    'categoria',
    'ativo',
    'notas',
  ],
  hub_finance_investments: [
    'titulo',
    'valor',
    'tipo',
    'responsavel',
    'status',
    'data_investimento',
    'notas',
  ],
};

export function applyFluxoToPayload(
  table: FinanceTable,
  payload: Record<string, unknown>,
  fluxoSecao?: FinanceFluxoSecao,
): Record<string, unknown> {
  const out = { ...payload };
  delete out.categoria;

  if (!fluxoSecao) return out;

  if (table === 'hub_finance_receivables' && fluxoSecao.fluxo === 'entrada') {
    out.notas = withEntradaTag(fluxoSecao.secao, out.notas as string | undefined);
  }
  if (table === 'hub_finance_investments' && fluxoSecao.fluxo === 'saida') {
    out.notas = withSaidaTag(fluxoSecao.secao, out.notas as string | undefined);
  }
  return out;
}
