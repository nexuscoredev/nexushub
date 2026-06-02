import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubSystem } from '../types/database';

export function SystemsPage() {
  const [systems, setSystems] = useState<HubSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase
      .from('hub_systems')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error: err }) => {
        if (err) setError(supabaseErrorMessage(err));
        else setSystems((data ?? []) as HubSystem[]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader
        badge="Integrations"
        title="Sistemas"
        subtitle="Produtos NEXUS — abrem em nova aba."
      />
      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {systems.map((sys) => (
          <article key={sys.id} className="card">
            <h3 style={{ marginBottom: '0.35rem' }}>{sys.nome}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {sys.descricao}
            </p>
            <a
              href={sys.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              Abrir sistema
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
