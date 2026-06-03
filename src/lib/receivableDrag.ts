import type { EntradaSecao } from './financeCategories';
import {
  parseParcelasFromReceivable,
  stripUserNotas,
  withParcelasInNotas,
} from './receivableParcelas';
import { supabase, supabaseErrorMessage } from './supabase';
import type { HubFinanceReceivable } from '../types/database';

function isMissingEntradaSecaoColumn(message: string): boolean {
  return message.includes('entrada_secao');
}

export function receivableWithEntradaSecao(
  row: HubFinanceReceivable,
  targetSecao: EntradaSecao,
): HubFinanceReceivable {
  const parcelas = parseParcelasFromReceivable(row);
  return {
    ...row,
    entrada_secao: targetSecao,
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
  if (!supabase) {
    return 'Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.';
  }

  const synced = receivableWithEntradaSecao(row, targetSecao);

  let res = await supabase
    .from('hub_finance_receivables')
    .update({
      entrada_secao: targetSecao,
      notas: synced.notas,
    })
    .eq('id', row.id)
    .select('id, entrada_secao');

  if (res.error && isMissingEntradaSecaoColumn(res.error.message)) {
    res = await supabase
      .from('hub_finance_receivables')
      .update({ notas: synced.notas })
      .eq('id', row.id)
      .select('id');
  }

  if (res.error) return supabaseErrorMessage(res.error);
  if (!res.data?.length) {
    return (
      'Salvamento bloqueado. Faça login com vinicius@nexustech.com ou rafael@nexustech.com ' +
      'e rode a migration 20260610120000_entrada_secao_column.sql no Supabase.'
    );
  }
  return null;
}
