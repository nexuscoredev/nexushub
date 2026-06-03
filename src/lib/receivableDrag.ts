import type { EntradaSecao } from './financeCategories';
import {
  parseParcelasFromReceivable,
  persistReceivable,
  stripUserNotas,
} from './receivableParcelas';
import { supabase } from './supabase';
import type { HubFinanceReceivable } from '../types/database';

export const RECEIVABLE_DRAG_MIME = 'application/x-nexushub-receivable-id';

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
