import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PersonalContasFixasView } from '../PersonalContasFixasView';
import { usePersonalFinanceRows } from '../../hooks/usePersonalFinanceRows';
import { usePersonalFinanceMacro } from '../../hooks/usePersonalFinanceMacro';
import {
  defaultDateForMonth,
  formatMonthLabel,
  parseMonthKey,
  resolveFinanceMonthKey,
  saveMonthKey,
} from '../../lib/personalFinanceMonth';
import {
  buildInitialMonthRows,
  clearMonthPagoMarks,
  mergeNewGrupoTemplates,
} from '../../lib/personalFinanceMonthView';
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
import { PersonalFinanceMacroHero } from './PersonalFinanceMacroHero';
import { PersonalFinanceTotalView } from './PersonalFinanceTotalView';
import styles from './PersonalFinancePanel.module.css';

type ViniciusFinanceView = 'contas' | 'receitas' | 'outros' | 'total';

interface PersonalFinancePanelProps {
  userEmail: string | undefined;
  userId: string | undefined;
}

const VINICIUS_TABS = [
  { id: 'contas', label: 'Contas', icon: '/img/personal/grupo-fixos.svg' },
  { id: 'receitas', label: 'Receitas', icon: '/img/finance/entradas.svg' },
  { id: 'outros', label: 'Outros', icon: '/img/finance/saidas.svg' },
  { id: 'total', label: 'Total', icon: '/img/finance/pendente.svg' },
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

  const {
    items: macroItems,
    summary: macroSummary,
    loading: macroLoading,
    error: macroError,
    refresh: refreshMacro,
    upsertLocal: upsertMacroLocal,
    removeLocal: removeMacroLocal,
  } = usePersonalFinanceMacro(userId);

  const allRowsRef = useRef(allRows);
  allRowsRef.current = allRows;

  const persistLocalMonth = useCallback(
    (rows: HubPersonalTransaction[]) => {
      if (!userId || !rows.length) return;
      const snapshot = saveMonthSnapshot(userId, selectedMonth, rows);
      setLastSavedAt(snapshot.savedAt);
    },
    [userId, selectedMonth],
  );

  // Carrega o mês só ao trocar de mês / user / fim do loading inicial.
  // NÃO depende de allRows — senão cada edição recarregava o snapshot antigo e revertia o valor.
  useEffect(() => {
    if (loading || !userId) return;

    const prev = prevMonthRef.current;
    if (prev && prev !== selectedMonth && monthRowsRef.current.length) {
      saveMonthSnapshot(userId, prev, monthRowsRef.current);
    }
    prevMonthRef.current = selectedMonth;

    let cancelled = false;
    void resolveMonthRows(userId, selectedMonth, allRowsRef.current).then((result) => {
      if (cancelled) return;
      setMonthRows(result.rows);
      setLastSavedAt(result.savedAt);
      setSaveError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, userId, loading]);

  // Contas novas no template entram no mês sem descartar edições locais.
  useEffect(() => {
    if (loading || !userId) return;
    setMonthRows((prev) => {
      if (!prev.length) return prev;
      return mergeNewGrupoTemplates(prev, allRows, selectedMonth);
    });
  }, [allRows, loading, userId, selectedMonth]);

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
      setMonthRows((prev) => {
        const next = prev.map((row) => (row.id === id ? { ...row, ...patch } : row));
        persistLocalMonth(next);
        return next;
      });
      const pagoOnly = Object.keys(patch).length === 1 && 'pago' in patch;
      if (!pagoOnly) {
        applyPatch(id, patch);
      }
    },
    [applyPatch, persistLocalMonth],
  );

  const handleMonthUpsert = useCallback(
    (row: HubPersonalTransaction) => {
      upsertRow(row);
      setMonthRows((prev) => {
        const idx = prev.findIndex((r) => r.id === row.id);
        const next =
          idx >= 0
            ? (() => {
                const copy = [...prev];
                copy[idx] = row;
                return copy;
              })()
            : [...prev, row];
        persistLocalMonth(next);
        return next;
      });
    },
    [upsertRow, persistLocalMonth],
  );

  const handleMonthRemove = useCallback(
    (id: string) => {
      applyRemove(id);
      setMonthRows((prev) => {
        const next = prev.filter((row) => row.id !== id);
        persistLocalMonth(next);
        return next;
      });
    },
    [applyRemove, persistLocalMonth],
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
  const isTotalView = viniciusLayout && viniciusView === 'total';

  return (
    <div className={styles.panel}>
      {error && <div className="error-banner">{error}</div>}
      {macroError && isTotalView && <div className="error-banner">{macroError}</div>}
      {saveError && !isTotalView && <div className="error-banner">{saveError}</div>}

      <div className={styles.chrome}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarMain}>
            {!isTotalView && (
              <PersonalFinanceMonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            )}
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
            {!isTotalView && savedLabel && <span className={styles.saveHint}>{savedLabel}</span>}
            <div className={styles.saveActions}>
              {viniciusLayout && !isTotalView && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setClearConfirmOpen(true)}
                  disabled={loading || !userId || !hasPagoMarks}
                  title="Desmarcar todos os pagos das contas fixas deste mês"
                >
                  <span className={styles.clearBtnFull}>Limpar marcações</span>
                  <span className={styles.clearBtnShort}>Limpar</span>
                </button>
              )}
              {!isTotalView && (
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={() => void handleSaveMonth()}
                  disabled={loading || saving || !userId}
                  title={`Salvar ${formatMonthLabel(selectedMonth)} na nuvem e neste dispositivo`}
                >
                  {saving ? 'Salvando…' : 'Salvar mês'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.summaryStrip}>
        {isTotalView ? (
          <PersonalFinanceMacroHero summary={macroSummary} loading={macroLoading} />
        ) : (
          <>
            <PersonalFinanceHero
              summary={summary}
              loading={loading}
              monthKey={selectedMonth}
              viniciusLayout={viniciusLayout}
            />
            {!(viniciusLayout && viniciusView === 'contas') && (
              <PersonalFinanceKpiGrid summary={summary} loading={loading} />
            )}
          </>
        )}
      </div>

      {viniciusLayout ? (
        <>
          {isTotalView ? (
            <div className={styles.contentCard}>
              <PersonalFinanceTotalView
                userId={userId}
                items={macroItems}
                loading={macroLoading}
                onUpsert={upsertMacroLocal}
                onRemove={removeMacroLocal}
                onSyncError={refreshMacro}
              />
            </div>
          ) : loading ? (
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
