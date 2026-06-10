import type { HubPersonalTransaction } from '../types/database';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/** YYYY-MM a partir de Date local (sem drift UTC). */
export function monthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date());
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const name = MONTHS_PT[(m ?? 1) - 1] ?? monthKey;
  return `${name} ${y}`;
}

export function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const name = MONTHS_PT[(m ?? 1) - 1]?.slice(0, 3) ?? '';
  return `${name}/${String(y).slice(-2)}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1 + delta, 1);
  return monthKeyFromDate(d);
}

export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === currentMonthKey();
}

/** Contas fixas (grupo) aparecem em todo mês; demais lançamentos filtram por data_referencia. */
export function filterRowsForMonth(
  rows: HubPersonalTransaction[],
  monthKey: string,
): HubPersonalTransaction[] {
  return rows.filter((row) => {
    if (row.grupo) return true;
    return row.data_referencia.slice(0, 7) === monthKey;
  });
}

/** Data padrão ao criar lançamento no mês selecionado. */
export function defaultDateForMonth(monthKey: string): string {
  if (isCurrentMonth(monthKey)) {
    return new Date().toISOString().slice(0, 10);
  }
  return `${monthKey}-01`;
}

export function parseMonthKey(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return null;
  const [, m] = raw.split('-').map(Number);
  if (m < 1 || m > 12) return null;
  return raw;
}
