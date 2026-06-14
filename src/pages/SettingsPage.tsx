import { Link } from 'react-router-dom';
import { InstallAppPrompt } from '../components/InstallAppPrompt';
import { HubNotificationSendForm } from '../components/notifications/HubNotificationSendForm';
import { PageHeader } from '../components/PageHeader';
import { useAppUpdateContext } from '../contexts/AppUpdateContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, profile, configured, podeGestao } = useAuth();
  const { updateAvailable, checking, applyUpdate, checkForUpdate } = useAppUpdateContext();

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
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Foto, nome e senha em{' '}
            <Link to="/perfil" style={{ color: 'var(--primary)' }}>
              Meu perfil
            </Link>
            .
          </p>
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
          <h2 className={styles.cardTitle}>Atualizações do Hub</h2>
          <p className={styles.cardLead}>
            Quando sair versão nova, use <strong>Atualizar agora</strong> — não precisa desinstalar o
            app. Reinstale só se o ícone ou a página inicial estiverem errados.
          </p>
          <div className={styles.updateActions}>
            {updateAvailable ? (
              <button type="button" className="btn-primary" onClick={applyUpdate}>
                Atualizar agora
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void checkForUpdate()}
                disabled={checking}
              >
                {checking ? 'Verificando…' : 'Verificar atualizações'}
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className={styles.cardTitle}>App no celular</h2>
          <p className={styles.cardLead}>
            Instale o site NEXUS na tela inicial — acesso rápido como app, sem loja.
          </p>
          <p className={styles.cardHint}>
            O atalho abre o site. Para o painel interno, entre no Hub pelo navegador.
          </p>
          <InstallAppPrompt variant="button" className={styles.installBtn} />
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

        {podeGestao ? (
          <section className="card">
            <h2 className={styles.cardTitle}>Notificações da equipe</h2>
            <p className={styles.cardLead}>
              Envie aviso para um membro ou para toda a equipe. O destinatário vê no sino do header.
            </p>
            <HubNotificationSendForm />
          </section>
        ) : null}
      </div>
    </div>
  );
}
