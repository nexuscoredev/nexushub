import { Link, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { TechShell } from '../components/TechShell';
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
    <TechShell>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <HubLogo size="sm" showSubtitle={false} />
            <small>{clienteConta?.cliente?.nome ?? 'Portal do cliente'}</small>
          </div>
          <div className={styles.actions}>
            <a href="/site/home.html" className={`btn-ghost ${styles.linkBtn}`}>
              Site NEXUS
            </a>
            <Link to="/login" className={`btn-ghost ${styles.linkBtn}`} title="Equipe NEXUS">
              Nexus Hub
            </Link>
            <button type="button" className={`btn-ghost ${styles.linkBtn}`} onClick={() => void handleSignOut()}>
              Sair
            </button>
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </TechShell>
  );
}
