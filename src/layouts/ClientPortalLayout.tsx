import { Link, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClientPortalLayout.module.css';

export function ClientPortalLayout() {
  const { clienteConta, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/cliente/entrar');
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <HubLogo size="sm" showSubtitle subtitleText="Client" surface="site" />
          <small>{clienteConta?.cliente?.nome ?? 'NexusClient'}</small>
        </div>
        <div className={styles.actions}>
          <a href="/site/home.html" className={styles.actionBtn}>
            Site NEXUS
          </a>
          <Link to="/login" className={styles.actionBtn} title="Equipe NEXUS">
            NexusHub
          </Link>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => void handleSignOut()}>
            Sair
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
