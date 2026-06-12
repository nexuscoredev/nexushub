import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PersonalContasFixasView } from '../PersonalContasFixasView';
import { usePersonalFinanceRows } from '../../hooks/usePersonalFinanceRows';
import {
  defaultDateForMonth,
  formatMonthLabel,
  parseMonthKey,
  resolveFinanceMonthKey,
  saveMonthKey,
} from '../../lib/personalFinanceMonth';
import { buildInitialMonthRows, clearMonthPagoMarks } from '../../lib/personalFinanceMonthView';
import {
  formatSnapshotSavedAt,
  loadMonthSnapshot,
  loadMonthSnapshotFromSupabase,
  persistMonthRowsToSupabase,
  persistMonthSnapshotToSupabase,
  saveMonthSnapshot,
} from '../../lib/personalFinanceSnapshot';
import { buildPessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import { isViniciusPersonalFinance } from '../../lib/viniciusPersonalFinance';
import type { HubPersonalTransaction } from '../../types/database';
import { PersonalFinanceConfirmModal } from './PersonalFinanceConfirmModal';
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

async function resolveMonthRows(
  userId: string,
  monthKey: string,
  allRows: HubPersonalTransaction[],
): Promise<{ rows: HubPersonalTransaction[]; savedAt: string | null }> {
  const local = loadMonthSnapshot(userId, monthKey);
  if (local?.rows.length) {
    return { rows: local.rows, savedAt: local.savedAt };
  }

  const remote = await loadMonthSnapshotFromSupabase(userId, monthKey);
  if (remote?.rows.length) {
    saveMonthSnapshot(userId, monthKey, remote.rows);
    return { rows: remote.rows, savedAt: remote.savedAt };
  }

  return { rows: buildInitialMonthRows(allRows, monthKey), savedAt: null };
}

export function PersonalFinancePanel({ userEmail, userId }: PersonalFinancePanelProps) {
  const viniciusLayout = isViniciusPersonalFinance(userEmail);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viniciusView, setViniciusView] = useState<ViniciusFinanceView>('contas');
  const [fluxo, setFluxo] = useState<'entrada' | 'saida'>('entrada');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [monthRows, setMonthRows] = useState<HubPersonalTransaction[]>([]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monthRowsRef = useRef(monthRows);
  const prevMonthRef = useRef<string | null>(null);

  monthRowsRef.current = monthRows;

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
  } = usePersonalFinanceRows();

  useEffect(() => {
    if (loading || !userId) return;

    const prev = prevMonthRef.current;
    if (prev && prev !== selectedMonth && monthRowsRef.current.length) {
      saveMonthSnapshot(userId, prev, monthRowsRef.current);
    }
    prevMonthRef.current = selectedMonth;

    let cancelled = false;
    void resolveMonthRows(userId, selectedMonth, allRows).then((result) => {
      if (cancelled) return;
      setMonthRows(result.rows);
      setLastSavedAt(result.savedAt);
      setSaveError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, userId, loading, allRows]);

  const summary = useMemo(() => buildPessoalFinanceSummary(monthRows), [monthRows]);
  const defaultDate = defaultDateForMonth(selectedMonth);

  useEffect(() => {
    if (!userId || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!monthRowsRef.current.length) return;
      const snapshot = saveMonthSnapshot(userId, selectedMonth, monthRowsRef.current);
      setLastSavedAt(snapshot.savedAt);
    }, AUTO_SAVE_MS);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [userId, selectedMonth, monthRows, loading]);

  const handleMonthPatch = useCallback(
    (id: string, patch: Partial<HubPersonalTransaction>) => {
      setMonthRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
      const pagoOnly = Object.keys(patch).length === 1 && 'pago' in patch;
      if (!pagoOnly) {
        applyPatch(id, patch);
      }
    },
    [applyPatch],
  );

  const handleMonthUpsert = useCallback(
    (row: HubPersonalTransaction) => {
      upsertRow(row);
      setMonthRows((prev) => {
        const idx = prev.findIndex((r) => r.id === row.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = row;
          return next;
        }
        return [...prev, row];
      });
    },
    [upsertRow],
  );

  const handleMonthRemove = useCallback(
    (id: string) => {
      applyRemove(id);
      setMonthRows((prev) => prev.filter((row) => row.id !== id));
    },
    [applyRemove],
  );

  const entradas = useMemo(() => monthRows.filter((r) => r.tipo === 'entrada'), [monthRows]);
  const saidasGenericas = useMemo(
    () => monthRows.filter((r) => r.tipo === 'saida' && !r.grupo),
    [monthRows],
  );

  const handleSaveMonth = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setSaveError(null);

    const snapshot = saveMonthSnapshot(userId, selectedMonth, monthRows);
    setLastSavedAt(snapshot.savedAt);

    const errTx = await persistMonthRowsToSupabase(monthRows);
    if (errTx) {
      setSaveError(`Salvo neste dispositivo. Nuvem (contas): ${errTx}`);
      setSaving(false);
      return;
    }

    const errSnap = await persistMonthSnapshotToSupabase(userId, selectedMonth, monthRows);
    if (errSnap) {
      setSaveError(`Salvo neste dispositivo. Nuvem (mês): ${errSnap}`);
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
  };

  const handleClearPagoMarks = () => {
    setMonthRows((prev) => clearMonthPagoMarks(prev));
    setClearConfirmOpen(false);
  };

  const savedLabel = lastSavedAt
    ? `Salvo às ${formatSnapshotSavedAt(lastSavedAt)}`
    : null;

  const hasPagoMarks = monthRows.some((row) => row.grupo && row.pago);

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
          <div className={styles.saveActions}>
            {viniciusLayout && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setClearConfirmOpen(true)}
                disabled={loading || !userId || !hasPagoMarks}
                title="Desmarcar todos os pagos das contas fixas deste mês"
              >
                Limpar marcações
              </button>
            )}
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
              rows={monthRows}
              summary={summary}
              defaultDate={defaultDate}
              onUpsert={handleMonthUpsert}
              onRemove={handleMonthRemove}
              onPatch={handleMonthPatch}
              onSyncError={refresh}
            />
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={viniciusView === 'receitas' ? entradas : saidasGenericas}
                presetTipo={viniciusView === 'receitas' ? 'entrada' : 'saida'}
                defaultDate={defaultDate}
                monthLabel={selectedMonth}
                onUpsert={handleMonthUpsert}
                onRemove={handleMonthRemove}
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
                onUpsert={handleMonthUpsert}
                onRemove={handleMonthRemove}
                onSyncError={refresh}
              />
            </div>
          )}
        </>
      )}

      <PersonalFinanceConfirmModal
        open={clearConfirmOpen}
        title="Limpar marcações"
        message={`Desmarcar todos os pagos das contas fixas de ${formatMonthLabel(selectedMonth)}?`}
        confirmLabel="Limpar"
        danger
        onConfirm={handleClearPagoMarks}
        onClose={() => setClearConfirmOpen(false)}
      />
    </div>
  );
}
