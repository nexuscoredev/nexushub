import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { NavIcon, type NavIconName } from '../components/NavIcon';
import { UserAvatar } from '../components/UserAvatar';
import { TechShell } from '../components/TechShell';
import { HubChatLauncher } from '../components/chat/HubChatLauncher';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: NavIconName;
  show: boolean;
}

export function DashboardLayout() {
  const { profile, user, podeFinanceiroAgenda, podeGestao, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Painel', icon: 'dashboard', show: true },
    { to: '/agenda', label: 'Agenda', icon: 'calendar', show: podeFinanceiroAgenda },
    { to: '/financeiro', label: 'Financeiro', icon: 'finance', show: podeFinanceiroAgenda },
    { to: '/chat', label: 'Chat', icon: 'chat', show: true },
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

          <div className={styles.commandMain}>
            <div className={styles.brandDock}>
              <HubLogo size="sm" showSubtitle={false} />
            </div>

            <nav className={styles.commandDock} aria-label="Navegação principal">
              <div className={styles.dockTrack}>
                {visibleNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${styles.dockLink} ${isActive ? styles.dockLinkActive : ''}`
                    }
                  >
                    <NavIcon name={item.icon} className={styles.dockIcon} />
                    <span className={styles.dockLabel}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>

            <div className={styles.userCompact}>
              <NavLink
                to="/perfil"
                className={styles.avatarLink}
                title="Meu perfil"
                aria-label="Meu perfil"
              >
                <UserAvatar
                  name={profile?.nome}
                  email={user?.email}
                  avatarUrl={profile?.avatar_url}
                />
              </NavLink>
              <button type="button" className={`btn-ghost ${styles.signOutBtn}`} onClick={handleSignOut}>
                Sair
              </button>
            </div>
          </div>

          <div className={styles.commandMeta}>
            <span className={styles.metaUser}>{profile?.nome ?? user?.email}</span>
            <span className={styles.metaDot} aria-hidden />
            <span className={styles.metaRole}>{profile?.cargo ?? '—'}</span>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
        {profile ? <HubChatLauncher profile={profile} /> : null}
      </div>
    </TechShell>
  );
}
