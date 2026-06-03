import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { NavIcon, type NavIconName } from '../components/NavIcon';
import { TechShell } from '../components/TechShell';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: NavIconName;
  show: boolean;
}

function userInitial(name: string | undefined, email: string | undefined): string {
  const n = (name ?? email ?? '?').trim();
  return n.charAt(0).toUpperCase();
}

export function DashboardLayout() {
  const { profile, user, podeFinanceiroAgenda, podeGestao, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Painel', icon: 'dashboard', show: true },
    { to: '/agenda', label: 'Agenda', icon: 'calendar', show: podeFinanceiroAgenda },
    { to: '/financeiro', label: 'Financeiro', icon: 'finance', show: podeFinanceiroAgenda },
    { to: '/fila', label: 'Fila', icon: 'queue', show: true },
    { to: '/sistemas', label: 'Sistemas', icon: 'systems', show: true },
    { to: '/usuarios', label: 'Usuários', icon: 'users', show: podeGestao },
    { to: '/configuracoes', label: 'Config', icon: 'settings', show: true },
  ];

  const visibleNav = navItems.filter((item) => item.show);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <TechShell>
      <div className={styles.shell}>
        <header className={styles.commandBar}>
          <div className={styles.commandGlow} aria-hidden />

          <div className={styles.commandTop}>
            <button
              type="button"
              className={`btn-ghost ${styles.menuToggle}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Menu de navegação"
            >
              {menuOpen ? <NavIcon name="close" className={styles.menuIcon} /> : <NavIcon name="menu" className={styles.menuIcon} />}
            </button>

            <div className={styles.brandCenter}>
              <HubLogo size="sm" showSubtitle={false} />
            </div>

            <div className={styles.userCompact}>
              <div className={styles.avatar} title={profile?.nome ?? user?.email}>
                {userInitial(profile?.nome, user?.email)}
              </div>
              <button type="button" className={`btn-ghost ${styles.signOutBtn}`} onClick={handleSignOut}>
                Sair
              </button>
            </div>
          </div>

          <nav
            className={`${styles.commandDock} ${menuOpen ? styles.commandDockOpen : ''}`}
            aria-label="Navegação principal"
          >
            <div className={styles.dockTrack}>
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.dockLink} ${isActive ? styles.dockLinkActive : ''}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <NavIcon name={item.icon} className={styles.dockIcon} />
                  <span className={styles.dockLabel}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div className={styles.commandMeta}>
            <span className={styles.metaUser}>{profile?.nome ?? user?.email}</span>
            <span className={styles.metaDot} aria-hidden />
            <span className={styles.metaRole}>{profile?.cargo ?? '—'}</span>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </TechShell>
  );
}
