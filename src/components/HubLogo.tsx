import styles from './HubLogo.module.css';

interface HubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  /** mark = ícone + wordmark; full = ícone maior + wordmark (landing) */
  variant?: 'full' | 'mark';
  centered?: boolean;
}

export function HubLogo({
  size = 'md',
  showSubtitle = true,
  variant = 'mark',
  centered = false,
}: HubLogoProps) {
  const resolvedSize = variant === 'full' && size === 'md' ? 'lg' : size;
  const sizeClass = styles[resolvedSize];

  return (
    <div
      className={`${styles.logo} ${sizeClass} ${styles.mark} ${centered ? styles.centered : ''}`}
    >
      <img
        src="/img/favicon.png"
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
