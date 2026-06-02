import { useAuth } from '../contexts/AuthContext';
export function SettingsPage() {
  const { user, profile, configured } = useAuth();

  return (
    <div>
      <h1 className="page-title">Configurações</h1>
      <p className="page-subtitle">Sessão e status do ambiente.</p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Sessão</h2>
        <dl style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div>
            <dt style={{ color: 'var(--muted)' }}>E-mail</dt>
            <dd>{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>Nome</dt>
            <dd>{profile?.nome ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>Cargo</dt>
            <dd>{profile?.cargo ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>ID</dt>
            <dd style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{user?.id ?? '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Ambiente</h2>
        <ul style={{ listStyle: 'none', fontSize: '0.9rem', color: 'var(--muted)' }}>
          <li>
            Supabase URL:{' '}
            {configured ? (
              <span style={{ color: 'var(--success)' }}>configurado</span>
            ) : (
              <span style={{ color: 'var(--danger)' }}>ausente</span>
            )}
          </li>
          <li style={{ marginTop: '0.35rem' }}>
            Anon key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'definida' : 'ausente'}
          </li>
          <li style={{ marginTop: '0.35rem' }}>
            APIs servidor (Todoist / Google): apenas na Vercel — sem prefixo VITE_
          </li>
        </ul>
      </div>
    </div>
  );
}
