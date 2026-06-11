import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NovidadesSparkIcon } from '../components/NovidadesSparkIcon';
import { NavIcon, type NavIconName } from '../components/NavIcon';
import { UserAvatar } from '../components/UserAvatar';
import { TechShell } from '../components/TechShell';
import { HubChatLauncher } from '../components/chat/HubChatLauncher';
import { HubNovidadesModal } from '../components/HubNovidadesModal';
import { hasUnseenNovidades } from '../data/hubNovidades';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: NavIconName;
  show: boolean;
}

export function DashboardLayout() {
  const { profile, user, podeFinanceiroAgenda, podeGestao, podeCofre, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [novidadesOpen, setNovidadesOpen] = useState(false);
  const [novidadesBadge, setNovidadesBadge] = useState(hasUnseenNovidades);

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Painel', icon: 'dashboard', show: true },
    { to: '/agenda', label: 'Agenda', icon: 'calendar', show: podeFinanceiroAgenda },
    { to: '/financeiro', label: 'Financeiro', icon: 'finance', show: podeFinanceiroAgenda },
    { to: '/fila', label: 'Fila', icon: 'queue', show: true },
    { to: '/sistemas', label: 'Sistemas', icon: 'systems', show: true },
    { to: '/usuarios', label: 'Usuários', icon: 'users', show: podeGestao },
    { to: '/cofre', label: 'Cofre', icon: 'vault', show: podeCofre },
    { to: '/configuracoes', label: 'Config', icon: 'settings', show: true },
    { to: '/desenvolvimento', label: 'Dev', icon: 'dev', show: true },
  ];

  const visibleNav = navItems.filter((item) => item.show);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  const openNovidades = () => {
    setNovidadesOpen(true);
    setNovidadesBadge(false);
  };

  const profileShortName = profile?.nome?.trim().split(/\s+/)[0] ?? 'Perfil';

  return (
    <TechShell>
      <div className={styles.shell}>
        <header className={styles.hubNav}>
          <div className={styles.hubNavBar}>
            <NavLink to="/dashboard" className={styles.brandBlock} aria-label="NEXUS Hub — painel">
              <img src="/img/favicon.png" alt="" className={styles.brandMark} width={28} height={28} />
              <span className={styles.brandName}>NEXUS</span>
            </NavLink>

            <button
              type="button"
              className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="hub-mobile-nav"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
            >
              <span className={styles.menuBars} aria-hidden>
                <span className={styles.menuBar} />
                <span className={styles.menuBar} />
                <span className={styles.menuBar} />
              </span>
            </button>

            <nav className={styles.hubNavLinks} aria-label="Navegação principal">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.hubNavLink} ${isActive ? styles.hubNavLinkActive : ''}`
                  }
                >
                  <NavIcon name={item.icon} className={styles.hubNavIcon} />
                  <span className={styles.hubNavLabel}>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className={styles.hubNavUtilities}>
              <button
                type="button"
                className={styles.novidadesBtn}
                onClick={openNovidades}
                aria-label="Novidades"
                title="Novidades"
              >
                <NovidadesSparkIcon className={styles.novidadesIcon} />
                {novidadesBadge && <span className={styles.novidadesBadge} aria-hidden />}
              </button>
              <NavLink
                to="/perfil"
                className={styles.accountPill}
                title="Meu perfil"
                aria-label="Meu perfil"
              >
                <UserAvatar
                  name={profile?.nome}
                  email={user?.email}
                  avatarUrl={profile?.avatar_url}
                  size="xs"
                />
                <span className={styles.accountText}>
                  {profileShortName}
                  <span className={styles.accountSuffix}> · Hub</span>
                </span>
              </NavLink>
              <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
                Sair
              </button>
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className={`${styles.mobileNav} ${styles.mobileNavOpen}`} role="presentation">
            <button
              type="button"
              className={styles.mobileBackdrop}
              onClick={closeMenu}
              aria-label="Fechar menu"
            />
            <nav
              id="hub-mobile-nav"
              className={styles.mobileDrawer}
              aria-label="Menu de navegação"
            >
              <div className={styles.mobileDrawerHead}>
                <div className={styles.mobileUser}>
                  <span className={styles.mobileUserName}>{profile?.nome ?? user?.email}</span>
                  <span className={styles.mobileUserRole}>{profile?.cargo ?? '—'}</span>
                </div>
              </div>

              <ul className={styles.mobileNavList}>
                {visibleNav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                      }
                      onClick={closeMenu}
                    >
                      <NavIcon name={item.icon} className={styles.mobileNavIcon} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className={styles.mobileDrawerFoot}>
                <button
                  type="button"
                  className={`${styles.mobileFootLink} ${styles.mobileNovidadesBtn}`}
                  onClick={() => {
                    closeMenu();
                    openNovidades();
                  }}
                  aria-label="Novidades"
                  title="Novidades"
                >
                  <NovidadesSparkIcon className={styles.novidadesIcon} />
                  <span>Novidades</span>
                  {novidadesBadge && <span className={styles.mobileNovidadesDot} aria-hidden />}
                </button>
                <NavLink
                  to="/perfil"
                  className={styles.mobileFootLink}
                  onClick={closeMenu}
                >
                  <UserAvatar
                    name={profile?.nome}
                    email={user?.email}
                    avatarUrl={profile?.avatar_url}
                  />
                  <span>Meu perfil</span>
                </NavLink>
                <button
                  type="button"
                  className={`btn-ghost ${styles.mobileSignOut}`}
                  onClick={() => void handleSignOut()}
                >
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}

        <main className={styles.main}>
          <Outlet />
        </main>
        {profile ? <HubChatLauncher profile={profile} /> : null}
        <HubNovidadesModal open={novidadesOpen} onClose={() => setNovidadesOpen(false)} />
      </div>
    </TechShell>
  );
}
