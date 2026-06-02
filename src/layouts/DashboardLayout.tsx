import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { TechShell } from '../components/TechShell';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
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
    { to: '/dashboard', label: 'Painel', icon: '◈', show: true },
    { to: '/agenda', label: 'Agenda', icon: '◷', show: podeFinanceiroAgenda },
    { to: '/financeiro', label: 'Financeiro', icon: '◎', show: podeFinanceiroAgenda },
    { to: '/fila', label: 'Fila operacional', icon: '≡', show: true },
    { to: '/sistemas', label: 'Sistemas', icon: '⬡', show: true },
    { to: '/usuarios', label: 'Usuários', icon: '◉', show: podeGestao },
    { to: '/configuracoes', label: 'Configurações', icon: '⚙', show: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
    <>
      <div className={styles.brand}>
        <HubLogo size="md" />
      </div>
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
              <span className={styles.navIcon} aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className={styles.userBlock}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>
            {userInitial(profile?.nome, user?.email)}
          </div>
          <div>
            <div className={styles.userName}>{profile?.nome ?? user?.email}</div>
            <div className={styles.userMeta}>{profile?.cargo ?? '—'}</div>
          </div>
          <span className={styles.statusDot} title="Online" />
        </div>
        <button type="button" className={`btn-ghost ${styles.signOut}`} onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </>
  );

  return (
    <TechShell>
      <div className={styles.shell}>
        <div
          className={menuOpen ? styles.overlayVisible : styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
          {sidebar}
        </aside>
        <div className={styles.mainWrap}>
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
    </TechShell>
  );
}
