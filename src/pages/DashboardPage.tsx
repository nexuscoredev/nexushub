import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SystemCard } from '../components/SystemCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubSystem } from '../types/database';

export function DashboardPage() {
  const { profile, podeFinanceiroAgenda } = useAuth();
  const [systems, setSystems] = useState<HubSystem[]>([]);
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

  const shortcuts = [
    { to: '/sistemas', label: 'Sistemas integrados' },
    { to: '/fila', label: 'Fila operacional' },
    ...(podeFinanceiroAgenda
      ? [
          { to: '/financeiro', label: 'Financeiro' },
          { to: '/agenda', label: 'Agenda' },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        badge="Overview"
        title="Painel"
        subtitle={`Olá, ${profile?.nome ?? 'usuário'}. Visão geral do NEXUS Hub.`}
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Sistemas ativos</div>
          <div className="kpi-value">{systems.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Seu cargo</div>
          <div className="kpi-value" style={{ fontSize: '1rem' }}>
            {profile?.cargo ?? '—'}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Acesso financeiro</div>
          <div className="kpi-value" style={{ fontSize: '1rem' }}>
            {podeFinanceiroAgenda ? 'Sim' : 'Não'}
          </div>
        </div>
      </div>

      <h2 className="section-heading">Atalhos</h2>
      <div className="link-grid">
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to} className="btn-ghost">
            {s.label}
          </Link>
        ))}
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
