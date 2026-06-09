import { Link, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClientPortalLayout.module.css';

const NAV = [
  { href: '#inicio', label: 'Início' },
  { href: '#jornada', label: 'Jornada' },
  { href: '#novidades', label: 'Novidades' },
  { href: '#contato', label: 'Contato' },
  { href: '#documentos', label: 'Documentos' },
] as const;

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
        <div className={styles.topbarMain}>
          <div className={styles.brand}>
            <HubLogo size="sm" showSubtitle subtitleText="Client" surface="site" />
            <small>{clienteConta?.cliente?.nome ?? 'NexusClient'}</small>
          </div>
          <div className={styles.actions}>
            <a href="/site/home.html" className={styles.actionBtn}>
              Site
            </a>
            <Link to="/login" className={styles.actionBtn} title="Equipe NEXUS">
              NexusHub
            </Link>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => void handleSignOut()}>
              Sair
            </button>
          </div>
        </div>
        <nav className={styles.sectionNav} aria-label="Seções do painel">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={styles.sectionLink}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span>NEXUS Technology Systems</span>
        <span className={styles.footerDot} aria-hidden />
        <span>Seu projeto, acompanhado de perto</span>
      </footer>
    </div>
  );
}
