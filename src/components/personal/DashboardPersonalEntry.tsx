import { Link } from 'react-router-dom';
import styles from './DashboardPersonalEntry.module.css';

export function DashboardPersonalEntry() {
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
