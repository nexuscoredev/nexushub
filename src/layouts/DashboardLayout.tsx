import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NovidadesSparkIcon } from '../components/NovidadesSparkIcon';
import { NavIcon } from '../components/NavIcon';
import { UserAvatar } from '../components/UserAvatar';
import { TechShell } from '../components/TechShell';
import { HubChatLauncher } from '../components/chat/HubChatLauncher';
import { JarvisLauncher } from '../components/jarvis/JarvisLauncher';
import { HubNotificationsBell } from '../components/notifications/HubNotificationsBell';
import { HubAccountMenu } from '../components/nav/HubAccountMenu';
import { HubNavMoreMenu } from '../components/nav/HubNavMoreMenu';
import { HubNovidadesModal } from '../components/HubNovidadesModal';
import { InstallAppPrompt } from '../components/InstallAppPrompt';
import { hasUnseenNovidades } from '../data/hubNovidades';
import { resolveHubNavItems } from '../lib/hubNav';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const { profile, user, podeFinanceiroAgenda, podeGestao, podeCofre, podePessoal, podeJarvis, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [novidadesOpen, setNovidadesOpen] = useState(false);
  const [novidadesBadge, setNovidadesBadge] = useState(hasUnseenNovidades);

  const { principal, mais } = useMemo(
    () =>
      resolveHubNavItems({
        finance: podeFinanceiroAgenda,
        gestao: podeGestao,
        cofre: podeCofre,
        jarvis: podeJarvis,
      }),
    [podeFinanceiroAgenda, podeGestao, podeCofre, podeJarvis],
  );

  const visibleNav = useMemo(() => [...principal, ...mais], [principal, mais]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
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
              {principal.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  data-label={item.label}
                  className={({ isActive }) =>
                    `${styles.hubNavLink} ${isActive ? styles.hubNavLinkActive : ''}`
                  }
                >
                  <NavIcon name={item.icon} className={styles.hubNavIcon} />
                  <span className={styles.hubNavLabel}>{item.label}</span>
                </NavLink>
              ))}
              <HubNavMoreMenu items={mais} />
            </nav>

            <div className={styles.hubNavUtilities}>
              <InstallAppPrompt variant="icon" className={styles.installNavBtn} />
              {user?.id ? <HubNotificationsBell userId={user.id} /> : null}
              <button
                type="button"
                className={styles.utilityBtn}
                onClick={openNovidades}
                aria-label="Novidades"
                title="Novidades"
              >
                <NovidadesSparkIcon className={styles.novidadesIcon} />
                {novidadesBadge ? <span className={styles.novidadesBadge} aria-hidden /> : null}
              </button>
              <HubAccountMenu
                name={profile?.nome}
                email={user?.email}
                avatarUrl={profile?.avatar_url}
                shortName={profileShortName}
                podePessoal={podePessoal}
                onSignOut={handleSignOut}
              />
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
                <UserAvatar
                  name={profile?.nome}
                  email={user?.email}
                  avatarUrl={profile?.avatar_url}
                />
                <div className={styles.mobileUser}>
                  <span className={styles.mobileUserName}>{profile?.nome ?? user?.email}</span>
                  <span className={styles.mobileUserRole}>{profile?.cargo ?? '—'}</span>
                </div>
              </div>

              <ul className={styles.mobileNavList}>
                {visibleNav.map((item) => (
                  <li key={item.id}>
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
                {podePessoal ? (
                  <NavLink to="/pessoal" className={styles.mobileFootLink} onClick={closeMenu}>
                    <span className={styles.mobilePessoalIcon} aria-hidden>
                      ✦
                    </span>
                    <span>Área pessoal</span>
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  className={`${styles.mobileFootLink} ${styles.mobileNovidadesBtn}`}
                  onClick={() => {
                    closeMenu();
                    openNovidades();
                  }}
                  aria-label="Novidades"
                >
                  <NovidadesSparkIcon className={styles.novidadesIcon} />
                  <span>Novidades</span>
                  {novidadesBadge ? <span className={styles.mobileNovidadesDot} aria-hidden /> : null}
                </button>
                <InstallAppPrompt variant="button" className={styles.mobileInstallBtn} />
                <NavLink to="/perfil" className={styles.mobileFootLink} onClick={closeMenu}>
                  <NavIcon name="personal" className={styles.mobileNavIcon} />
                  <span>Meu perfil</span>
                </NavLink>
                <button
                  type="button"
                  className={`btn-ghost ${styles.mobileSignOut}`}
                  onClick={() => void handleSignOut().then(() => navigate('/login'))}
                >
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}

        <main className={styles.main}>
          <InstallAppPrompt variant="banner" />
          <Outlet />
        </main>
        {profile ? <HubChatLauncher profile={profile} /> : null}
        {profile && podeJarvis ? <JarvisLauncher profile={profile} userId={user?.id} /> : null}
        <HubNovidadesModal open={novidadesOpen} onClose={() => setNovidadesOpen(false)} />
      </div>
    </TechShell>
  );
}
