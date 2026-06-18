import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isHubNavActive, type HubNavItem } from '../../lib/hubNav';
import { NavIcon } from '../NavIcon';
import styles from './HubNavMoreMenu.module.css';

interface HubNavMoreMenuProps {
  items: HubNavItem[];
}

export function HubNavMoreMenu({ items }: HubNavMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const hasActive = items.some((item) => isHubNavActive(location.pathname, item.to));

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

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

  if (items.length === 0) return null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${hasActive ? styles.triggerActive : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mais páginas"
      >
        <NavIcon name="menu" className={styles.triggerIcon} />
        <span className={styles.triggerLabel}>Mais</span>
        <NavIcon name="chevronDown" className={styles.chevron} />
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              role="menuitem"
              className={({ isActive }) =>
                `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
              }
              onClick={() => setOpen(false)}
            >
              <NavIcon name={item.icon} className={styles.menuIcon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
