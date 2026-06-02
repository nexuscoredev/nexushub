import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubProfile } from '../types/database';

export function UsersPage() {
  const [users, setUsers] = useState<HubProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from('hub_profiles')
      .select('*')
      .order('nome')
      .then(({ data, error: err }) => {
        if (err) setError(supabaseErrorMessage(err));
        else setUsers((data ?? []) as HubProfile[]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Usuários"
        subtitle="Perfis do hub (gestão)."
      />
      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Cargo</th>
              <th>Ativo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>{u.cargo}</td>
                <td>{u.ativo ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
