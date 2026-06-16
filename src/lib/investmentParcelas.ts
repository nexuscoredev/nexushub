import type { FinanceFluxoSecao } from './financeCategories';
import type { HubFinanceInvestment } from '../types/database';
import {
  type ParcelasState,
  valorPagoFromState,
  valorParcela,
} from './receivableParcelas';

export type { ParcelasState };
export { valorPagoFromState, valorParcela };

const PARCELAS_TAG_RE = /#parcelas:(\{.*?\})/;
const SAIDA_TAG_RE = /#saida:(assinaturas|transporte|outras)\s*/g;

export function stripParcelasTag(notas: string | null | undefined): string {
  return (notas ?? '').replace(/#parcelas:\{.*?\}\s*/g, '').trim();
}

/** Notas visíveis ao usuário (sem marcadores internos). */
export function stripUserNotas(notas: string | null | undefined): string {
  return stripParcelasTag((notas ?? '').replace(SAIDA_TAG_RE, '').trim());
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

export function parseParcelasFromInvestment(i: HubFinanceInvestment): ParcelasState {
  const fromNotas = parseParcelasTag(i.notas);
  if (fromNotas) return fromNotas;

  if (typeof i.parcelado === 'boolean') {
    return {
      parcelado: i.parcelado,
      qtd_parcelas: Math.max(1, i.qtd_parcelas ?? 1),
      parcelas_pagas: [...(i.parcelas_pagas ?? [])].sort((a, b) => a - b),
    };
  }
  if (i.status === 'pago') {
    return { parcelado: false, qtd_parcelas: 1, parcelas_pagas: [1] };
  }
  return { parcelado: false, qtd_parcelas: 1, parcelas_pagas: [] };
}

export function valorPagoInvestment(i: HubFinanceInvestment): number {
  return valorPagoFromState(Number(i.valor), parseParcelasFromInvestment(i));
}

export function valorRestanteInvestment(i: HubFinanceInvestment): number {
  return Math.max(0, Number(i.valor) - valorPagoInvestment(i));
}

export function deriveInvestmentStatus(
  valor: number,
  p: ParcelasState,
): string {
  const pago = valorPagoFromState(valor, p);
  if (pago >= valor) return 'pago';
  if (pago > 0) return 'pendente';
  return 'pendente';
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

  if (fluxoSecao?.fluxo === 'saida') {
    const head = `#saida:${fluxoSecao.secao} ${parcelasTag}`;
    return userBody ? `${head} ${userBody}` : head;
  }

  return userBody ? `${parcelasTag} ${userBody}` : parcelasTag;
}

export function buildInvestmentSavePayload(
  fields: {
    titulo: string;
    valor: number;
    tipo: string;
    responsavel: string;
    data_investimento?: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Record<string, unknown> {
  const status = deriveInvestmentStatus(fields.valor, parcelas);
  const notas = withParcelasInNotas(fields.notas, parcelas, fluxoSecao);
  return {
    titulo: fields.titulo,
    valor: fields.valor,
    tipo: fields.tipo,
    responsavel: fields.responsavel,
    status,
    data_investimento: fields.data_investimento ?? null,
    notas,
    parcelado: parcelas.parcelado,
    qtd_parcelas: parcelas.parcelado ? parcelas.qtd_parcelas : null,
    parcelas_pagas: parcelas.parcelas_pagas,
  };
}

export function buildInvestmentSavePayloadSafe(
  fields: {
    titulo: string;
    valor: number;
    tipo: string;
    responsavel: string;
    data_investimento?: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Record<string, unknown> {
  const full = buildInvestmentSavePayload(fields, parcelas, fluxoSecao);
  return {
    titulo: full.titulo,
    valor: full.valor,
    tipo: full.tipo,
    responsavel: full.responsavel,
    status: full.status,
    data_investimento: full.data_investimento,
    notas: full.notas,
  };
}

function isMissingParcelasColumn(message: string): boolean {
  return (
    message.includes('parcelado') ||
    message.includes('qtd_parcelas') ||
    message.includes('parcelas_pagas')
  );
}

export async function persistInvestment(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  id: string | null,
  fields: {
    titulo: string;
    valor: number;
    tipo: string;
    responsavel: string;
    data_investimento?: string;
    notas?: string;
  },
  parcelas: ParcelasState,
  fluxoSecao?: FinanceFluxoSecao,
): Promise<string | null> {
  const full = buildInvestmentSavePayload(fields, parcelas, fluxoSecao);
  const minimal = buildInvestmentSavePayloadSafe(fields, parcelas, fluxoSecao);

  const run = (body: Record<string, unknown>) =>
    id
      ? supabase.from('hub_finance_investments').update(body).eq('id', id)
      : supabase.from('hub_finance_investments').insert(body);

  let res = await run(full);

  if (res.error && isMissingParcelasColumn(res.error.message)) {
    res = await run(minimal);
  }

  if (res.error?.message.includes('schema cache')) {
    res = await run(minimal);
  }

  return res.error?.message ?? null;
}
