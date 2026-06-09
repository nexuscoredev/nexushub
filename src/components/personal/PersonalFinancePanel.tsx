import { useCallback, useEffect, useMemo, useState } from 'react';
import { PersonalContasFixasView } from '../PersonalContasFixasView';
import { PersonalFinanceHero } from './PersonalFinanceHero';
import { PersonalFinanceKpiGrid } from './PersonalFinanceKpiGrid';
import { PersonalFinanceNav } from './PersonalFinanceNav';
import { PersonalTransactionCards } from './PersonalTransactionCards';
import {
  saldoPessoal,
  totalEntradasPessoal,
  totalSaidasPessoal,
} from '../../lib/pessoal';
import { totalFixosPessoal } from '../../lib/personalFinanceVisuals';
import { supabase, supabaseErrorMessage } from '../../lib/supabase';
import { isViniciusPersonalFinance } from '../../lib/viniciusPersonalFinance';
import type { HubPersonalTransaction } from '../../types/database';
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
  const [rows, setRows] = useState<HubPersonalTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('hub_personal_transactions')
      .select('*')
      .order('grupo', { ascending: true, nullsFirst: false })
      .order('ordem', { ascending: true })
      .order('data_referencia', { ascending: false });
    if (err) setError(supabaseErrorMessage(err));
    else setRows((data ?? []) as HubPersonalTransaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entradas = useMemo(() => rows.filter((r) => r.tipo === 'entrada'), [rows]);
  const saidasGenericas = useMemo(
    () => rows.filter((r) => r.tipo === 'saida' && !r.grupo),
    [rows],
  );

  const kpiValues = useMemo(
    () => ({
      entradas: totalEntradasPessoal(rows),
      saidas: totalSaidasPessoal(rows),
      saldo: saldoPessoal(rows),
    }),
    [rows],
  );

  const activeVinicius = viniciusView;
  const activeGeneric = fluxo;

  return (
    <div className={styles.panel}>
      {error && <div className="error-banner">{error}</div>}

      <PersonalFinanceHero totalFixos={totalFixosPessoal(rows)} loading={loading} />

      <PersonalFinanceKpiGrid values={kpiValues} rows={rows} loading={loading} />

      {viniciusLayout ? (
        <>
          <PersonalFinanceNav
            tabs={[...VINICIUS_TABS]}
            active={activeVinicius}
            onChange={(id) => setViniciusView(id as ViniciusFinanceView)}
          />

          {loading ? (
            <p className={styles.loading}>Carregando seu painel…</p>
          ) : viniciusView === 'contas' ? (
            <PersonalContasFixasView rows={rows} onRefresh={load} />
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={viniciusView === 'receitas' ? entradas : saidasGenericas}
                presetTipo={viniciusView === 'receitas' ? 'entrada' : 'saida'}
                onRefresh={load}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <PersonalFinanceNav
            tabs={[...GENERIC_TABS]}
            active={activeGeneric}
            onChange={(id) => setFluxo(id as 'entrada' | 'saida')}
          />

          {loading ? (
            <p className={styles.loading}>Carregando seu painel…</p>
          ) : (
            <div className={styles.contentCard}>
              <PersonalTransactionCards
                rows={fluxo === 'entrada' ? entradas : saidasGenericas}
                presetTipo={fluxo}
                onRefresh={load}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
