import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClientThemeToggle } from '../components/client/ClientThemeToggle';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClientPortalLayout.module.css';

const PORTAL_NAV = [
  { href: '#inicio', label: 'Início' },
  { href: '#jornada', label: 'Jornada' },
  { href: '#novidades', label: 'Novidades' },
  { href: '#contato', label: 'Contato' },
  { href: '#documentos', label: 'Documentos' },
] as const;

const LIGEIRINHO_NAV = [
  { href: '#pronto', label: 'Pronto' },
  { href: '#entregas', label: 'Entregas' },
  { href: '#proximos', label: 'Próximos' },
  { href: '#atencao', label: 'Atenção' },
] as const;

export function ClientPortalLayout() {
  const { clienteConta, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLigeirinhoPage = location.pathname === '/cliente/ligeirinho';
  const isLigeirinhoClient = clienteConta?.cliente?.slug === 'ligeirinho';

  const handleSignOut = async () => {
    await signOut();
    navigate('/cliente/entrar');
  };

  return (
    <div className={`nx-client-shell ${styles.shell}`}>
      <header className={styles.topbar}>
        <div className={styles.topbarMain}>
          <div className={styles.brand}>
            <HubLogo size="sm" showSubtitle subtitleText="Client" surface="site" />
            <small>{clienteConta?.cliente?.nome ?? 'NexusClient'}</small>
          </div>
          <div className={styles.actions}>
            <ClientThemeToggle />
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
          {isLigeirinhoPage ? (
            <>
              <Link to="/cliente" className={styles.sectionLink}>
                Painel
              </Link>
              {LIGEIRINHO_NAV.map((item) => (
                <a key={item.href} href={item.href} className={styles.sectionLink}>
                  {item.label}
                </a>
              ))}
            </>
          ) : (
            <>
              {PORTAL_NAV.map((item) => (
                <a key={item.href} href={item.href} className={styles.sectionLink}>
                  {item.label}
                </a>
              ))}
              {isLigeirinhoClient ? (
                <Link to="/cliente/ligeirinho" className={styles.sectionLink}>
                  Relatório
                </Link>
              ) : null}
            </>
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
