import styles from './ClientePortalQuickNav.module.css';

export type PortalNavItem = {
  href: string;
  label: string;
};

interface ClientePortalQuickNavProps {
  items: PortalNavItem[];
}

export function ClientePortalQuickNav({ items }: ClientePortalQuickNavProps) {
  return (
    <nav className={styles.nav} aria-label="Atalhos do painel">
      {items.map((item) => (
        <a key={item.href} href={item.href} className={styles.pill}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
