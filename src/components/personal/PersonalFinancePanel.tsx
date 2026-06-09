import { useMemo, useState } from 'react';
import { PersonalContasFixasView } from '../PersonalContasFixasView';
import { usePersonalFinanceRows } from '../../hooks/usePersonalFinanceRows';
import { isViniciusPersonalFinance } from '../../lib/viniciusPersonalFinance';
import type { HubPersonalTransaction } from '../../types/database';
import { PersonalFinanceHero } from './PersonalFinanceHero';
import { PersonalFinanceKpiGrid } from './PersonalFinanceKpiGrid';
import { PersonalFinanceNav } from './PersonalFinanceNav';
import { PersonalTransactionCards } from './PersonalTransactionCards';
import styles from './PersonalFinancePanel.module.css';

type ViniciusFinanceView = 'contas' | 'receitas' | 'outros';

interface PersonalFinancePanelProps {
  userEmail: string | undefined;
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

export function PersonalFinancePanel({ userEmail }: PersonalFinancePanelProps) {
  const viniciusLayout = isViniciusPersonalFinance(userEmail);
  const [viniciusView, setViniciusView] = useState<ViniciusFinanceView>('contas');
  const [fluxo, setFluxo] = useState<'entrada' | 'saida'>('entrada');

  const {
    rows,
    loading,
    error,
    summary,
    refresh,
    applyPatch,
    applyRemove,
    upsertRow,
  } = usePersonalFinanceRows();

  const handleUpsert = (row: HubPersonalTransaction) => {
    upsertRow(row);
  };

  const entradas = useMemo(() => rows.filter((r) => r.tipo === 'entrada'), [rows]);
  const saidasGenericas = useMemo(
    () => rows.filter((r) => r.tipo === 'saida' && !r.grupo),
    [rows],
  );

  return (
    <div className={styles.panel}>
      {error && <div className="error-banner">{error}</div>}

      <PersonalFinanceHero summary={summary} loading={loading} />

      <PersonalFinanceKpiGrid summary={summary} loading={loading} />

      {viniciusLayout ? (
        <>
          <PersonalFinanceNav
            tabs={[...VINICIUS_TABS]}
            active={viniciusView}
            onChange={(id) => setViniciusView(id as ViniciusFinanceView)}
          />

          {loading ? (
            <p className={styles.loading}>Carregando seu painel…</p>
          ) : viniciusView === 'contas' ? (
            <PersonalContasFixasView
              rows={rows}
              summary={summary}
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
                onUpsert={handleUpsert}
                onRemove={applyRemove}
                onSyncError={refresh}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <PersonalFinanceNav
            tabs={[...GENERIC_TABS]}
            active={fluxo}
            onChange={(id) => setFluxo(id as 'entrada' | 'saida')}
          />

          {loading ? (
            <p className={styles.loading}>Carregando seu painel…</p>
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={fluxo === 'entrada' ? entradas : saidasGenericas}
                presetTipo={fluxo}
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
