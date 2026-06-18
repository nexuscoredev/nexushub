import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { NavIcon } from '../NavIcon';
import { UserAvatar } from '../UserAvatar';
import styles from './HubAccountMenu.module.css';

interface HubAccountMenuProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  shortName: string;
  podePessoal: boolean;
  onSignOut: () => Promise<void>;
}

export function HubAccountMenu({
  name,
  email,
  avatarUrl,
  shortName,
  podePessoal,
  onSignOut,
}: HubAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await onSignOut();
    navigate('/login');
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu da conta"
      >
        <UserAvatar name={name} email={email} avatarUrl={avatarUrl} size="xs" />
        <span className={styles.triggerText}>
          {shortName}
          <span className={styles.triggerSuffix}> · Hub</span>
        </span>
        <NavIcon name="chevronDown" className={styles.chevron} />
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.menuName}>{name ?? email ?? 'Conta'}</span>
            {email ? <span className={styles.menuEmail}>{email}</span> : null}
          </div>
          <NavLink
            to="/perfil"
            role="menuitem"
            className={({ isActive }) =>
              `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
            }
            onClick={() => setOpen(false)}
          >
            <NavIcon name="personal" className={styles.menuIcon} />
            Meu perfil
          </NavLink>
          {podePessoal ? (
            <NavLink
              to="/pessoal"
              role="menuitem"
              className={({ isActive }) =>
                `${styles.menuItem} ${styles.menuItemPessoal} ${isActive ? styles.menuItemActive : ''}`
              }
              onClick={() => setOpen(false)}
            >
              <span className={styles.pessoalMark} aria-hidden>
                ✦
              </span>
              Área pessoal
            </NavLink>
          ) : null}
          <button type="button" role="menuitem" className={styles.menuItemDanger} onClick={() => void handleSignOut()}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
