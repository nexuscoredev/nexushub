import styles from './HubLogo.module.css';

interface HubLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function HubLogo({ size = 'md', showSubtitle = true }: HubLogoProps) {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <span className={styles.wordmark}>NEXUS</span>
      {showSubtitle && <span className={styles.subtitle}>Hub</span>}
    </div>
  );
}
