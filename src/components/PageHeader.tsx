import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ title, subtitle, badge, actions, compact }: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${compact ? styles.headerCompact : ''}`}>
      <div className={styles.accent} aria-hidden />
      <div className={styles.row}>
        <div>
          {badge && <span className={styles.badge}>{badge}</span>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}