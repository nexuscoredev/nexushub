import { Link } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import styles from './LandingPage.module.css';

export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={`${styles.glow} ${styles.glowOne}`} />
      <div className={`${styles.glow} ${styles.glowTwo}`} />
      <div className={styles.content}>
        <HubLogo size="lg" />
        <p className={styles.tagline}>
          Painel administrativo central da NEXUS Technology Systems — sistemas,
          fila, finanças e agenda em um só lugar.
        </p>
        <Link to="/login" className="btn-primary">
          Acessar painel
        </Link>
      </div>
    </div>
  );
}
