import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildPessoalFinanceSummary } from '../lib/pessoalFinanceSummary';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubPersonalTransaction } from '../types/database';

export function usePersonalFinanceRows() {
  const [rows, setRows] = useState<HubPersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!supabase) return;
    if (!opts?.silent) setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('hub_personal_transactions')
      .select('*')
      .order('grupo', { ascending: true, nullsFirst: false })
      .order('ordem', { ascending: true })
      .order('data_referencia', { ascending: false });
    if (err) {
      setError(supabaseErrorMessage(err));
    } else {
      setRows((data ?? []) as HubPersonalTransaction[]);
    }
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildPessoalFinanceSummary(rows), [rows]);

  const applyPatch = useCallback((id: string, patch: Partial<HubPersonalTransaction>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }, []);

  const applyRemove = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const applyInsert = useCallback((row: HubPersonalTransaction) => {
    setRows((prev) => [...prev, row]);
  }, []);

  const upsertRow = useCallback((row: HubPersonalTransaction) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
  }, []);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return {
    rows,
    loading,
    error,
    setError,
    summary,
    load,
    refresh,
    applyPatch,
    applyRemove,
    applyInsert,
    upsertRow,
    setRows,
  };
}
