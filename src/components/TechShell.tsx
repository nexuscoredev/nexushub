import type { ReactNode } from 'react';
import styles from './TechShell.module.css';

export function TechShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.root}>
      <div className={styles.mesh} aria-hidden />
      <div className={styles.grid} aria-hidden />
      <div className={`${styles.orb} ${styles.orbA}`} aria-hidden />
      <div className={`${styles.orb} ${styles.orbB}`} aria-hidden />
      <div className={styles.scanline} aria-hidden />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
