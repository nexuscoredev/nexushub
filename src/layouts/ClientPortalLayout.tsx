import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SiteThemeToggle } from '../components/SiteThemeToggle';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import { CLIENTE_PORTAL_NAV, CLIENTE_PORTAL_NAV_LIGEIRINHO } from '../lib/clientePortalNav';
import styles from './ClientPortalLayout.module.css';

export function ClientPortalLayout() {
  const { clienteConta, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPortalHome = location.pathname === '/cliente';
  const isLigeirinhoClient = clienteConta?.cliente?.slug === 'ligeirinho';
  const portalNav = isLigeirinhoClient ? CLIENTE_PORTAL_NAV_LIGEIRINHO : CLIENTE_PORTAL_NAV;

  const handleSignOut = async () => {
    await signOut();
    navigate('/cliente/entrar');
  };

  return (
    <div className={`nx-client-shell ${styles.shell}`}>
      <header className={styles.topbar}>
        <div className={styles.topbarMain}>
          <div className={styles.brand}>
            <HubLogo size="sm" showSubtitle subtitleText="Client" surface="site" accent="client" />
            <small>{clienteConta?.cliente?.nome ?? 'NexusClient'}</small>
          </div>
          <div className={styles.actions}>
            <SiteThemeToggle />
            <a href="/site/home.html" className={styles.actionBtn}>
              Site NEXUS
            </a>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => void handleSignOut()}>
              Sair
            </button>
          </div>
        </div>
        <nav className={styles.sectionNav} aria-label="Seções do painel">
          {isPortalHome ? (
            portalNav.map((item) => (
              <a key={item.href} href={item.href} className={styles.sectionLink}>
                {item.label}
              </a>
            ))
          ) : (
            <Link to="/cliente" className={styles.sectionLink}>
              Voltar ao painel
            </Link>
          )}
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
