import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildPersonalFinanceMacroSummary,
  fetchPersonalFinanceMacroItems,
} from '../lib/personalFinanceMacro';
import type { HubPersonalFinanceMacroItem } from '../types/database';

export function usePersonalFinanceMacro(userId: string | undefined) {
  const [items, setItems] = useState<HubPersonalFinanceMacroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const rows = await fetchPersonalFinanceMacroItems(userId);
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar visão macro.');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildPersonalFinanceMacroSummary(items), [items]);

  const upsertLocal = useCallback((item: HubPersonalFinanceMacroItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((row) => row.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const removeLocal = useCallback((id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return {
    items,
    summary,
    loading,
    error,
    refresh,
    upsertLocal,
    removeLocal,
  };
}
