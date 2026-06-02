import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      <h1 className="page-title">Painel</h1>
      <p className="page-subtitle">
        Olá, {profile?.nome ?? 'usuário'}. Visão geral do NEXUS Hub.
      </p>

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

      <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--muted)' }}>
        Atalhos
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to} className="btn-ghost">
            {s.label}
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--muted)' }}>
        Produtos NEXUS
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {systems.map((sys) => (
          <a
            key={sys.id}
            href={sys.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{ display: 'block' }}
          >
            <strong>{sys.nome}</strong>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {sys.descricao}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
