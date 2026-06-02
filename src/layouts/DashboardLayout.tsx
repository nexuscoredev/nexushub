import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  show: boolean;
}

export function DashboardLayout() {
  const { profile, user, podeFinanceiroAgenda, podeGestao, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Painel', show: true },
    { to: '/agenda', label: 'Agenda', show: podeFinanceiroAgenda },
    { to: '/financeiro', label: 'Financeiro', show: podeFinanceiroAgenda },
    { to: '/fila', label: 'Fila operacional', show: true },
    { to: '/sistemas', label: 'Sistemas', show: true },
    { to: '/usuarios', label: 'Usuários', show: podeGestao },
    { to: '/configuracoes', label: 'Configurações', show: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
  <>
      <HubLogo size="md" />
      <nav className={styles.nav}>
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className={styles.userBlock}>
        <div className={styles.userName}>{profile?.nome ?? user?.email}</div>
        <div className={styles.userMeta}>{profile?.cargo ?? '—'}</div>
        <button type="button" className={`btn-ghost ${styles.signOut}`} onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.shell}>
      <div
        className={menuOpen ? styles.overlayVisible : styles.overlay}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        {sidebar}
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className={styles.mobileBar}>
          <HubLogo size="sm" />
          <button type="button" className="btn-ghost" onClick={() => setMenuOpen(true)}>
            Menu
          </button>
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
