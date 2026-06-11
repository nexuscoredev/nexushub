import { defaultDateForMonth } from './personalFinanceMonth';
import type { HubPersonalTransaction } from '../types/database';

function uniqueById(rows: HubPersonalTransaction[]): HubPersonalTransaction[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** Monta o estado inicial de um mês sem snapshot salvo. */
export function buildInitialMonthRows(
  allRows: HubPersonalTransaction[],
  monthKey: string,
): HubPersonalTransaction[] {
  const defaultDate = defaultDateForMonth(monthKey);

  const grupoRows = uniqueById(allRows.filter((row) => row.grupo)).map((row) => ({
    ...row,
    pago: false,
    data_referencia: defaultDate,
  }));

  const monthTx = allRows.filter(
    (row) => !row.grupo && row.data_referencia.slice(0, 7) === monthKey,
  );

  return [...grupoRows, ...monthTx];
}

/** Mescla templates de grupo novos em allRows que ainda não existem no snapshot do mês. */
export function mergeNewGrupoTemplates(
  monthRows: HubPersonalTransaction[],
  allRows: HubPersonalTransaction[],
  monthKey: string,
): HubPersonalTransaction[] {
  const ids = new Set(monthRows.map((r) => r.id));
  const defaultDate = defaultDateForMonth(monthKey);
  const additions = uniqueById(allRows.filter((row) => row.grupo && !ids.has(row.id))).map(
    (row) => ({
      ...row,
      pago: false,
      data_referencia: defaultDate,
    }),
  );
  return additions.length ? [...monthRows, ...additions] : monthRows;
}

/** Desmarca todos os pagos das contas fixas do mês atual. */
export function clearMonthPagoMarks(
  rows: HubPersonalTransaction[],
): HubPersonalTransaction[] {
  return rows.map((row) => (row.grupo ? { ...row, pago: false } : row));
}
