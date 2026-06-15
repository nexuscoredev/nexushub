import { Link } from 'react-router-dom';
import styles from './DashboardPersonalEntry.module.css';

interface DashboardPersonalEntryProps {
  variant?: 'banner' | 'nav';
  className?: string;
}

export function DashboardPersonalEntry({ variant = 'banner', className }: DashboardPersonalEntryProps) {
  if (variant === 'nav') {
    return (
      <Link
        to="/pessoal"
        className={`${styles.navBtn} ${className ?? ''}`.trim()}
        title="Área Pessoal — Como você está hoje? Um cantinho só seu."
        aria-label="Área Pessoal"
      >
        <span className={styles.navIcon} aria-hidden>
          ✦
        </span>
        <span className={styles.navLabel}>Pessoal</span>
      </Link>
    );
  }

  return (
    <Link to="/pessoal" className={styles.entry}>
      <span className={styles.icon} aria-hidden>
        ✦
      </span>
      <span className={styles.body}>
        <span className={styles.copy}>
          <span className={styles.title}>Área Pessoal</span>
          <span className={styles.sub}>Como você está hoje? Um cantinho só seu.</span>
        </span>
        <span className={styles.arrow} aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
