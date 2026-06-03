import type { EntradaSecao } from './financeCategories';
import {
  parseParcelasFromReceivable,
  stripUserNotas,
  withParcelasInNotas,
} from './receivableParcelas';
import { supabase, supabaseErrorMessage } from './supabase';
import type { HubFinanceReceivable } from '../types/database';

export function receivableWithEntradaSecao(
  row: HubFinanceReceivable,
  targetSecao: EntradaSecao,
): HubFinanceReceivable {
  const parcelas = parseParcelasFromReceivable(row);
  return {
    ...row,
    notas: withParcelasInNotas(stripUserNotas(row.notas), parcelas, {
      fluxo: 'entrada',
      secao: targetSecao,
    }),
  };
}

export async function moveReceivableToSecao(
  row: HubFinanceReceivable,
  targetSecao: EntradaSecao,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado. Verifique o .env.local / Vercel.';

  const notas = receivableWithEntradaSecao(row, targetSecao).notas;

  const { data, error } = await supabase
    .from('hub_finance_receivables')
    .update({ notas })
    .eq('id', row.id)
    .select('id');

  if (error) return supabaseErrorMessage(error);
  if (!data?.length) {
    return 'Não foi possível salvar. Faça login novamente ou verifique permissão no Supabase.';
  }
  return null;
}
