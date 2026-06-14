import { useEffect, useMemo, useState } from 'react';
import { DashboardFinanceKpi } from '../components/DashboardFinanceKpi';
import { DashboardPersonalEntry } from '../components/personal/DashboardPersonalEntry';
import { PageHeader } from '../components/PageHeader';
import { SystemCard } from '../components/SystemCard';
import { useAuth } from '../contexts/AuthContext';
import {
  lucroMensalEstimado,
  totalImplantacaoAReceber,
  totalMensalidade,
} from '../lib/financeiro';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type {
  HubFinanceInvestment,
  HubFinanceReceivable,
  HubFinanceSubscription,
  HubSystem,
} from '../types/database';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { profile, podeFinanceiroAgenda, podePessoal } = useAuth();
  const [systems, setSystems] = useState<HubSystem[]>([]);
  const [receivables, setReceivables] = useState<HubFinanceReceivable[]>([]);
  const [subscriptions, setSubscriptions] = useState<HubFinanceSubscription[]>([]);
  const [investments, setInvestments] = useState<HubFinanceInvestment[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from('hub_systems')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error: err }) => {
        if (err) setError(supabaseErrorMessage(err));
        else setSystems((data ?? []) as HubSystem[]);
      });
  }, []);

  useEffect(() => {
    if (!podeFinanceiroAgenda || !supabase) return;
    setFinanceLoading(true);
    void Promise.all([
      supabase.from('hub_finance_receivables').select('*'),
      supabase.from('hub_finance_subscriptions').select('*'),
      supabase.from('hub_finance_investments').select('*'),
    ])
      .then(([r, s, i]) => {
        const err = r.error ?? s.error ?? i.error;
        if (err) {
          setError(supabaseErrorMessage(err));
          return;
        }
        setReceivables((r.data ?? []) as HubFinanceReceivable[]);
        setSubscriptions((s.data ?? []) as HubFinanceSubscription[]);
        setInvestments((i.data ?? []) as HubFinanceInvestment[]);
      })
      .finally(() => setFinanceLoading(false));
  }, [podeFinanceiroAgenda]);

  const financeSummary = useMemo(
    () => ({
      lucroMensal: lucroMensalEstimado(subscriptions, receivables, investments),
      implantacaoAReceber: totalImplantacaoAReceber(receivables),
      mensalidadesMes: totalMensalidade(subscriptions, receivables),
    }),
    [subscriptions, receivables, investments],
  );

  return (
    <div>
      <PageHeader
        badge="Overview"
        title="Painel"
        subtitle={
          profile?.nome
            ? `${profile.nome} — visão geral do NEXUS Hub`
            : 'Visão geral do NEXUS Hub'
        }
      />

      {error && <div className="error-banner">{error}</div>}

      {podePessoal && <DashboardPersonalEntry />}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Sistemas ativos</div>
          <div className="kpi-value">{systems.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Seu cargo</div>
          <div className={`kpi-value ${styles.cargoValue}`}>
            {profile?.cargo ?? '—'}
          </div>
        </div>
        {podeFinanceiroAgenda && (
          <DashboardFinanceKpi
            lucroMensal={financeSummary.lucroMensal}
            implantacaoAReceber={financeSummary.implantacaoAReceber}
            mensalidadesMes={financeSummary.mensalidadesMes}
            loading={financeLoading}
          />
        )}
      </div>

      <h2 className="section-heading">Produtos NEXUS</h2>
      <div className="product-grid">
        {systems.map((sys) => (
          <SystemCard key={sys.id} system={sys} variant="link" />
        ))}
      </div>
    </div>
  );
}
