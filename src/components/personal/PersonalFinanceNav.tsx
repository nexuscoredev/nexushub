import type { CSSProperties, ReactNode } from 'react';
import styles from './PersonalFinanceNav.module.css';

export type PersonalFinanceTab = {
  id: string;
  label: string;
  icon: string;
};

interface PersonalFinanceNavProps {
  tabs: PersonalFinanceTab[];
  active: string;
  onChange: (id: string) => void;
}

export function PersonalFinanceNav({ tabs, active, onChange }: PersonalFinanceNavProps) {
  return (
    <nav className={styles.nav} aria-label="Seções financeiras">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tab} ${active === tab.id ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <img src={tab.icon} alt="" className={styles.tabIcon} aria-hidden />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function PersonalFinanceSection({
  icon,
  accent,
  title,
  subtitle,
  total,
  children,
}: {
  icon: string;
  accent: string;
  title: string;
  subtitle?: string;
  total?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} style={{ '--accent': accent } as CSSProperties}>
      <header className={styles.sectionHead}>
        <img src={icon} alt="" className={styles.sectionIcon} aria-hidden />
        <div className={styles.sectionCopy}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          {subtitle && <p className={styles.sectionSub}>{subtitle}</p>}
        </div>
        {total && <span className={styles.sectionTotal}>{total}</span>}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
