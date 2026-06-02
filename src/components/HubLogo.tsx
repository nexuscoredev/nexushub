import styles from './HubLogo.module.css';

interface HubLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  /** full = imagem horizontal; mark = ícone + texto */
  variant?: 'full' | 'mark';
}

export function HubLogo({
  size = 'md',
  showSubtitle = true,
  variant = 'mark',
}: HubLogoProps) {
  if (variant === 'full') {
    return (
      <div className={`${styles.logo} ${styles[size]} ${styles.full}`}>
        <img
          src="/logo-nexus.svg"
          alt="NEXUS Hub"
          className={styles.fullImg}
          width={240}
          height={64}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.logo} ${styles[size]} ${styles.mark}`}>
      <img
        src="/logo-nexus-mark.svg"
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
