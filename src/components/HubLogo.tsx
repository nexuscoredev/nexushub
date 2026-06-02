import styles from './HubLogo.module.css';

interface HubLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  /** mark = ícone + wordmark; full = ícone maior + wordmark (landing) */
  variant?: 'full' | 'mark';
}

export function HubLogo({
  size = 'md',
  showSubtitle = true,
  variant = 'mark',
}: HubLogoProps) {
  const sizeClass = variant === 'full' ? styles.lg : styles[size];

  return (
    <div className={`${styles.logo} ${sizeClass} ${styles.mark}`}>
      <img
        src="/img/nexus-mark.png"
        alt=""
        className={styles.markImg}
        aria-hidden
      />
      <div className={styles.text}>
        <span className={styles.wordmark}>NEXUS</span>
        {showSubtitle && <span className={styles.subtitle}>Hub</span>}
      </div>
    </div>
  );
}
