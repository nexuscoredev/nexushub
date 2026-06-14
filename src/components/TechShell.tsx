import { useRef, type ReactNode } from 'react';
import { useMetalPointer } from '../hooks/useMetalPointer';
import styles from './TechShell.module.css';

export function TechShell({
  children,
  variant = 'hub',
}: {
  children: ReactNode;
  variant?: 'hub' | 'client';
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useMetalPointer(rootRef);

  return (
    <div
      className={`${styles.root} ${variant === 'client' ? styles.rootClient : ''}`}
      ref={rootRef}
    >
      <div className={styles.mesh} aria-hidden />
      <div className={styles.grid} aria-hidden />
      <div className={styles.metalSheen} aria-hidden />
      <div className={`${styles.orb} ${styles.orbA}`} aria-hidden />
      <div className={`${styles.orb} ${styles.orbB}`} aria-hidden />
      <div className={styles.scanline} aria-hidden />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
