import { supabase, supabaseErrorMessage } from './supabase';
import type { HubPersonalTransaction } from '../types/database';

const STORAGE_PREFIX = 'nexushub.personalFinance.snapshot';

export interface PersonalFinanceMonthSnapshot {
  monthKey: string;
  savedAt: string;
  rows: HubPersonalTransaction[];
}

function storageKey(userId: string, monthKey: string): string {
  return `${STORAGE_PREFIX}.${userId}.${monthKey}`;
}

export function loadMonthSnapshot(
  userId: string | undefined,
  monthKey: string,
): PersonalFinanceMonthSnapshot | null {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, monthKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersonalFinanceMonthSnapshot;
    if (parsed.monthKey !== monthKey || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMonthSnapshot(
  userId: string,
  monthKey: string,
  rows: HubPersonalTransaction[],
): PersonalFinanceMonthSnapshot {
  const snapshot: PersonalFinanceMonthSnapshot = {
    monthKey,
    savedAt: new Date().toISOString(),
    rows,
  };
  localStorage.setItem(storageKey(userId, monthKey), JSON.stringify(snapshot));
  return snapshot;
}

export function formatSnapshotSavedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export async function loadMonthSnapshotFromSupabase(
  userId: string,
  monthKey: string,
): Promise<PersonalFinanceMonthSnapshot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_finance_months')
    .select('month_key, rows, saved_at')
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .maybeSingle();

  if (error || !data) return null;

  const rows = data.rows as HubPersonalTransaction[];
  if (!Array.isArray(rows)) return null;

  return {
    monthKey: data.month_key,
    savedAt: data.saved_at,
    rows,
  };
}

export async function persistMonthSnapshotToSupabase(
  userId: string,
  monthKey: string,
  rows: HubPersonalTransaction[],
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const savedAt = new Date().toISOString();
  const { error } = await supabase.from('hub_personal_finance_months').upsert(
    {
      user_id: userId,
      month_key: monthKey,
      rows,
      saved_at: savedAt,
    },
    { onConflict: 'user_id,month_key' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export async function persistMonthRowsToSupabase(
  rows: HubPersonalTransaction[],
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';
  if (rows.length === 0) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return 'Sessão inválida.';

  const now = new Date().toISOString();
  const payload = rows.map((row) => {
    const base = { ...row, user_id: userId, updated_at: now };
    // pago é por mês (snapshot); templates de grupo não guardam pago global
    if (row.grupo) {
      return { ...base, pago: false };
    }
    return base;
  });

  const { error } = await supabase
    .from('hub_personal_transactions')
    .upsert(payload, { onConflict: 'id' });

  return error ? supabaseErrorMessage(error) : null;
}
