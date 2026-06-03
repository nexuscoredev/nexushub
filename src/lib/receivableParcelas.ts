import type { FinanceFluxoSecao } from './financeCategories';
import type { HubFinanceReceivable } from '../types/database';

export interface ParcelasState {
  parcelado: boolean;
  qtd_parcelas: number;
  parcelas_pagas: number[];
}

const PARCELAS_TAG_RE = /#parcelas:(\{.*?\})/;
const ENTRADA_TAG_RE = /#entrada:(implantacoes|mensalidades)\s*/g;

export function stripParcelasTag(notas: string | null | undefined): string {
  return (notas ?? '').replace(/#parcelas:\{.*?\}\s*/g, '').trim();
}

/** Notas visíveis ao usuário (sem marcadores internos). */
export function stripUserNotas(notas: string | null | undefined): string {
  return stripParcelasTag((notas ?? '').replace(ENTRADA_TAG_RE, '').trim());
}

function parseParcelasTag(notas: string | null | undefined): ParcelasState | null {
  const m = notas?.match(PARCELAS_TAG_RE);
  if (!m) return null;
  try {
    const raw = JSON.parse(m[1]) as {
      parcelado?: boolean;
      qtd?: number;
      pagas?: number[];
    };
    return {
      parcelado: Boolean(raw.parcelado),
      qtd_parcelas: Math.max(1, Number(raw.qtd) || 1),
      parcelas_pagas: Array.isArray(raw.pagas)
        ? raw.pagas.map(Number).filter((n) => n >= 1)
        : [],
    };
  } catch {
    return null;
  }
}

export function parseParcelasFromReceivable(r: HubFinanceReceivable): ParcelasState {
  const fromNotas = parseParcelasTag(r.notas);
  if (fromNotas) return fromNotas;

  if (typeof r.parcelado === 'boolean') {
    return {
      parcelado: r.parcelado,
      qtd_parcelas: Math.max(1, r.qtd_parcelas ?? 1),
      parcelas_pagas: [...(r.parcelas_pagas ?? [])].sort((a, b) => a - b),
    };
  }
  if (r.status === 'recebido') {
    return { parcelado: false, qtd_parcelas: 1, parcelas_pagas: [1] };
  }
  return { parcelado: false, qtd_parcelas: 1, parcelas_pagas: [] };
}

export function valorPagoFromState(valor: number, p: ParcelasState): number {
  const total = Number(valor);
  if (!p.parcelado) {
    return p.parcelas_pagas.length > 0 ? total : 0;
  }
  const qtd = Math.max(1, p.qtd_parcelas);
  const unit = total / qtd;
  return unit * p.parcelas_pagas.length;
}

export function valorPagoReceivable(r: HubFinanceReceivable): number {
  return valorPagoFromState(Number(r.valor), parseParcelasFromReceivable(r));
}

export function valorRestanteReceivable(r: HubFinanceReceivable): number {
  return Math.max(0, Number(r.valor) - valorPagoReceivable(r));
}

export function deriveReceivableStatus(
  valor: number,
  p: ParcelasState,
): HubFinanceReceivable['status'] {
  const pago = valorPagoFromState(valor, p);
  if (pago >= valor) return 'recebido';
  if (pago > 0) return 'pendente';
  return 'pendente';
}

export function valorParcela(valor: number, p: ParcelasState): number {
  if (!p.parcelado) return Number(valor);
  return Number(valor) / Math.max(1, p.qtd_parcelas);
}

export function withParcelasInNotas(
  notas: string | null | undefined,
  p: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): string {
  const userBody = stripUserNotas(notas);
  const parcelasTag = `#parcelas:${JSON.stringify({
    parcelado: p.parcelado,
    qtd: p.qtd_parcelas,
    pagas: p.parcelas_pagas,
  })}`;

  if (fluxoSecao?.fluxo === 'entrada') {
    const head = `#entrada:${fluxoSecao.secao} ${parcelasTag}`;
    return userBody ? `${head} ${userBody}` : head;
  }

  return userBody ? `${parcelasTag} ${userBody}` : parcelasTag;
}

export function buildReceivableSavePayload(
  fields: {
    cliente_descricao: string;
    valor: number;
    data_prevista: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Record<string, unknown> {
  const status = deriveReceivableStatus(fields.valor, parcelas);
  const notas = withParcelasInNotas(fields.notas, parcelas, fluxoSecao);
  const payload: Record<string, unknown> = {
    cliente_descricao: fields.cliente_descricao,
    valor: fields.valor,
    data_prevista: fields.data_prevista,
    status,
    notas,
    parcelado: parcelas.parcelado,
    qtd_parcelas: parcelas.parcelado ? parcelas.qtd_parcelas : null,
    parcelas_pagas: parcelas.parcelas_pagas,
  };
  if (fluxoSecao?.fluxo === 'entrada') {
    payload.entrada_secao = fluxoSecao.secao;
  }
  return payload;
}

/** Payload mínimo se colunas de parcela não existirem no Supabase. */
export function buildReceivableSavePayloadSafe(
  fields: {
    cliente_descricao: string;
    valor: number;
    data_prevista: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Record<string, unknown> {
  const full = buildReceivableSavePayload(fields, parcelas, fluxoSecao);
  return {
    cliente_descricao: full.cliente_descricao,
    valor: full.valor,
    data_prevista: full.data_prevista,
    status: full.status,
    notas: full.notas,
  };
}

function isMissingEntradaSecaoColumn(message: string): boolean {
  return message.includes('entrada_secao');
}

function isMissingParcelasColumn(message: string): boolean {
  return (
    message.includes('parcelado') ||
    message.includes('qtd_parcelas') ||
    message.includes('parcelas_pagas')
  );
}

function withoutEntradaSecao(body: Record<string, unknown>): Record<string, unknown> {
  const { entrada_secao: _e, ...rest } = body;
  return rest;
}

export async function persistReceivable(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  id: string | null,
  fields: {
    cliente_descricao: string;
    valor: number;
    data_prevista: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Promise<string | null> {
  const full = buildReceivableSavePayload(fields, parcelas, fluxoSecao);
  const minimal = buildReceivableSavePayloadSafe(fields, parcelas, fluxoSecao);

  const run = (body: Record<string, unknown>) =>
    id
      ? supabase.from('hub_finance_receivables').update(body).eq('id', id)
      : supabase.from('hub_finance_receivables').insert(body);

  let res = await run(full);

  if (res.error && isMissingEntradaSecaoColumn(res.error.message)) {
    res = await run(withoutEntradaSecao(full));
  }

  if (res.error && isMissingParcelasColumn(res.error.message)) {
    res = await run(minimal);
  }

  if (res.error?.message.includes('schema cache')) {
    res = await run(minimal);
  }

  return res.error?.message ?? null;
}
