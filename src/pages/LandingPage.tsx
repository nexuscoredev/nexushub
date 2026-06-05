import { Link } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { TechShell } from '../components/TechShell';
import styles from './LandingPage.module.css';

export function LandingPage() {
  return (
    <TechShell>
      <div className={styles.page}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.content}>
          <span className={styles.eyebrow}>NEXUS Technology Systems</span>
          <HubLogo size="xl" variant="full" centered />
          <div className={styles.actions}>
            <Link to="/login" className="btn-primary">
              Acessar painel
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statVal}>3</span>
              <span className={styles.statLabel}>Sistemas</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statVal}>∞</span>
              <span className={styles.statLabel}>Integrações</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statVal}>24/7</span>
              <span className={styles.statLabel}>Operação</span>
            </div>
          </div>
        </div>
      </div>
    </TechShell>
  );
}
