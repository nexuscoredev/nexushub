import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, profile, configured } = useAuth();

  return (
    <div>
      <PageHeader
        badge="System"
        title="Configurações"
        subtitle="Sessão e status do ambiente."
      />

      <div className={styles.grid}>
        <section className="card">
          <h2 className={styles.cardTitle}>Sessão</h2>
          <dl className={styles.dl}>
            <div>
              <dt>Usuário</dt>
              <dd>{profile?.usuario ?? '—'}</dd>
            </div>
            <div>
              <dt>Nome</dt>
              <dd>{profile?.nome ?? '—'}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{profile?.cargo ?? '—'}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd className={styles.mono}>{user?.id ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className={styles.cardTitle}>Ambiente</h2>
          <ul className={styles.envList}>
            <li>
              <span>Supabase URL</span>
              {configured ? (
                <span className={styles.ok}>Online</span>
              ) : (
                <span className={styles.err}>Ausente</span>
              )}
            </li>
            <li>
              <span>Anon key</span>
              <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? styles.ok : styles.err}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'Ausente'}
              </span>
            </li>
            <li>
              <span>APIs servidor</span>
              <span className={styles.muted}>Vercel only</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
