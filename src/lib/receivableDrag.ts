import type { EntradaSecao } from './financeCategories';
import {
  parseParcelasFromReceivable,
  persistReceivable,
  stripUserNotas,
} from './receivableParcelas';
import { supabase } from './supabase';
import type { HubFinanceReceivable } from '../types/database';

export const RECEIVABLE_DRAG_MIME = 'application/x-nexushub-receivable-id';
const RECEIVABLE_DRAG_PREFIX = 'nexushub-receivable:';

/** Fallback quando o browser não expõe o MIME customizado no dragover/drop. */
let activeReceivableDragId: string | null = null;

export function setActiveReceivableDragId(id: string | null): void {
  activeReceivableDragId = id;
}

export function getActiveReceivableDragId(): string | null {
  return activeReceivableDragId;
}

export function setReceivableDragData(dataTransfer: DataTransfer, receivableId: string): void {
  dataTransfer.clearData();
  dataTransfer.setData(RECEIVABLE_DRAG_MIME, receivableId);
  dataTransfer.setData('text/plain', `${RECEIVABLE_DRAG_PREFIX}${receivableId}`);
  dataTransfer.effectAllowed = 'move';
  setActiveReceivableDragId(receivableId);
}

export function readReceivableDragId(dataTransfer: DataTransfer): string | null {
  const custom = dataTransfer.getData(RECEIVABLE_DRAG_MIME);
  if (custom) return custom;
  const plain = dataTransfer.getData('text/plain');
  if (plain.startsWith(RECEIVABLE_DRAG_PREFIX)) {
    return plain.slice(RECEIVABLE_DRAG_PREFIX.length);
  }
  return getActiveReceivableDragId();
}

export function isReceivableDragEvent(e: { dataTransfer: DataTransfer }): boolean {
  if (getActiveReceivableDragId()) return true;
  const types = [...e.dataTransfer.types];
  return (
    types.includes(RECEIVABLE_DRAG_MIME) ||
    types.includes('text/plain') ||
    types.includes('Text')
  );
}

export async function moveReceivableToSecao(
  row: HubFinanceReceivable,
  targetSecao: EntradaSecao,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const parcelas = parseParcelasFromReceivable(row);
  return persistReceivable(
    supabase,
    row.id,
    {
      cliente_descricao: row.cliente_descricao,
      valor: Number(row.valor),
      data_prevista: row.data_prevista,
      notas: stripUserNotas(row.notas) || undefined,
    },
    parcelas,
    { fluxo: 'entrada', secao: targetSecao },
  );
}
