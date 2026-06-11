import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PersonalContasFixasView } from '../PersonalContasFixasView';
import { usePersonalFinanceRows } from '../../hooks/usePersonalFinanceRows';
import {
  defaultDateForMonth,
  filterRowsForMonth,
  formatMonthLabel,
  parseMonthKey,
  resolveFinanceMonthKey,
  saveMonthKey,
} from '../../lib/personalFinanceMonth';
import {
  formatSnapshotSavedAt,
  loadMonthSnapshot,
  persistMonthRowsToSupabase,
  saveMonthSnapshot,
} from '../../lib/personalFinanceSnapshot';
import { buildPessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import { isViniciusPersonalFinance } from '../../lib/viniciusPersonalFinance';
import type { HubPersonalTransaction } from '../../types/database';
import { PersonalFinanceHero } from './PersonalFinanceHero';
import { PersonalFinanceKpiGrid } from './PersonalFinanceKpiGrid';
import { PersonalFinanceMonthPicker } from './PersonalFinanceMonthPicker';
import { PersonalFinanceNav } from './PersonalFinanceNav';
import { PersonalTransactionCards } from './PersonalTransactionCards';
import styles from './PersonalFinancePanel.module.css';

type ViniciusFinanceView = 'contas' | 'receitas' | 'outros';

interface PersonalFinancePanelProps {
  userEmail: string | undefined;
  userId: string | undefined;
}

const VINICIUS_TABS = [
  { id: 'contas', label: 'Contas fixas', icon: '/img/personal/grupo-fixos.svg' },
  { id: 'receitas', label: 'Receitas', icon: '/img/finance/entradas.svg' },
  { id: 'outros', label: 'Outros gastos', icon: '/img/finance/saidas.svg' },
] as const;

const GENERIC_TABS = [
  { id: 'entrada', label: 'Receitas', icon: '/img/finance/entradas.svg' },
  { id: 'saida', label: 'Gastos', icon: '/img/finance/saidas.svg' },
] as const;

const AUTO_SAVE_MS = 800;

export function PersonalFinancePanel({ userEmail, userId }: PersonalFinancePanelProps) {
  const viniciusLayout = isViniciusPersonalFinance(userEmail);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viniciusView, setViniciusView] = useState<ViniciusFinanceView>('contas');
  const [fluxo, setFluxo] = useState<'entrada' | 'saida'>('entrada');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urlMonth = searchParams.get('mes');
  const selectedMonth = useMemo(() => resolveFinanceMonthKey(urlMonth), [urlMonth]);

  const setSelectedMonth = useCallback(
    (monthKey: string) => {
      saveMonthKey(monthKey);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('financeiro', '1');
          next.set('mes', monthKey);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    saveMonthKey(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (parseMonthKey(urlMonth)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('financeiro', '1');
        next.set('mes', selectedMonth);
        return next;
      },
      { replace: true },
    );
  }, [urlMonth, selectedMonth, setSearchParams]);

  const {
    rows: allRows,
    loading,
    error,
    refresh,
    applyPatch,
    applyRemove,
    upsertRow,
    setRows,
  } = usePersonalFinanceRows();

  const rows = useMemo(
    () => filterRowsForMonth(allRows, selectedMonth),
    [allRows, selectedMonth],
  );

  const summary = useMemo(() => buildPessoalFinanceSummary(rows), [rows]);
  const defaultDate = defaultDateForMonth(selectedMonth);

  useEffect(() => {
    const snapshot = loadMonthSnapshot(userId, selectedMonth);
    setLastSavedAt(snapshot?.savedAt ?? null);
    setSaveError(null);
  }, [userId, selectedMonth]);

  useEffect(() => {
    if (loading || !userId || rows.length > 0) return;
    const snapshot = loadMonthSnapshot(userId, selectedMonth);
    if (!snapshot?.rows.length) return;
    setRows((prev) => {
      const ids = new Set(prev.map((row) => row.id));
      const restored = snapshot.rows.filter((row) => !ids.has(row.id));
      return restored.length ? [...prev, ...restored] : prev;
    });
  }, [loading, userId, selectedMonth, rows.length, setRows]);

  useEffect(() => {
    if (!userId || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const snapshot = saveMonthSnapshot(userId, selectedMonth, rows);
      setLastSavedAt(snapshot.savedAt);
    }, AUTO_SAVE_MS);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [userId, selectedMonth, rows, loading]);

  const handleUpsert = (row: HubPersonalTransaction) => {
    upsertRow(row);
  };

  const entradas = useMemo(() => rows.filter((r) => r.tipo === 'entrada'), [rows]);
  const saidasGenericas = useMemo(
    () => rows.filter((r) => r.tipo === 'saida' && !r.grupo),
    [rows],
  );

  const handleSaveMonth = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setSaveError(null);

    const err = await persistMonthRowsToSupabase(rows);
    if (err) {
      setSaveError(err);
      setSaving(false);
      return;
    }

    const snapshot = saveMonthSnapshot(userId, selectedMonth, rows);
    setLastSavedAt(snapshot.savedAt);
    await refresh();
    setSaving(false);
  };

  const savedLabel = lastSavedAt
    ? `Salvo às ${formatSnapshotSavedAt(lastSavedAt)}`
    : null;

  return (
    <div className={styles.panel}>
      {error && <div className="error-banner">{error}</div>}
      {saveError && <div className="error-banner">{saveError}</div>}

      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <PersonalFinanceMonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          {viniciusLayout ? (
            <PersonalFinanceNav
              tabs={[...VINICIUS_TABS]}
              active={viniciusView}
              onChange={(id) => setViniciusView(id as ViniciusFinanceView)}
            />
          ) : (
            <PersonalFinanceNav
              tabs={[...GENERIC_TABS]}
              active={fluxo}
              onChange={(id) => setFluxo(id as 'entrada' | 'saida')}
            />
          )}
        </div>
        <div className={styles.saveWrap}>
          {savedLabel && <span className={styles.saveHint}>{savedLabel}</span>}
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => void handleSaveMonth()}
            disabled={loading || saving || !userId}
            title={`Salvar ${formatMonthLabel(selectedMonth)} na nuvem e neste dispositivo`}
          >
            {saving ? 'Salvando…' : 'Salvar mês'}
          </button>
        </div>
      </div>

      <div className={styles.summaryStrip}>
        <PersonalFinanceHero
          summary={summary}
          loading={loading}
          monthKey={selectedMonth}
          viniciusLayout={viniciusLayout}
        />
        {!(viniciusLayout && viniciusView === 'contas') && (
          <PersonalFinanceKpiGrid summary={summary} loading={loading} />
        )}
      </div>

      {viniciusLayout ? (
        <>
          {loading ? (
            <p className={styles.loading}>Carregando…</p>
          ) : viniciusView === 'contas' ? (
            <PersonalContasFixasView
              rows={rows}
              summary={summary}
              defaultDate={defaultDate}
              onUpsert={handleUpsert}
              onRemove={applyRemove}
              onPatch={applyPatch}
              onSyncError={refresh}
            />
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={viniciusView === 'receitas' ? entradas : saidasGenericas}
                presetTipo={viniciusView === 'receitas' ? 'entrada' : 'saida'}
                defaultDate={defaultDate}
                monthLabel={selectedMonth}
                onUpsert={handleUpsert}
                onRemove={applyRemove}
                onSyncError={refresh}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {loading ? (
            <p className={styles.loading}>Carregando…</p>
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={fluxo === 'entrada' ? entradas : saidasGenericas}
                presetTipo={fluxo}
                defaultDate={defaultDate}
                monthLabel={selectedMonth}
                onUpsert={handleUpsert}
                onRemove={applyRemove}
                onSyncError={refresh}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
