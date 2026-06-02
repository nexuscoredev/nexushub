import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SystemCard } from '../components/SystemCard';
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
      <div className="product-grid">
        {systems.map((sys) => (
          <SystemCard key={sys.id} system={sys} />
        ))}
      </div>
    </div>
  );
}
