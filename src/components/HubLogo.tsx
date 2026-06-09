import styles from './HubLogo.module.css';

interface HubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  /** Texto ao lado do wordmark NEXUS (ex.: Hub, Client) */
  subtitleText?: string;
  /** mark = ícone + wordmark; full = ícone maior + wordmark (landing) */
  variant?: 'full' | 'mark';
  centered?: boolean;
  /** Ajusta cores para fundo claro do site */
  surface?: 'hub' | 'site';
}

export function HubLogo({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Hub',
  variant = 'mark',
  centered = false,
  surface = 'hub',
}: HubLogoProps) {
  const resolvedSize = variant === 'full' && size === 'md' ? 'lg' : size;
  const sizeClass = styles[resolvedSize];

  return (
    <div
      className={`${styles.logo} ${sizeClass} ${styles.mark} ${centered ? styles.centered : ''} ${surface === 'site' ? styles.siteSurface : ''}`}
    >
      <img
        src="/img/favicon.png"
        alt=""
        className={styles.markImg}
        aria-hidden
      />
      <div className={styles.brand}>
        <span className={styles.wordmark}>NEXUS</span>
        {showSubtitle && <span className={styles.hubMark}>{subtitleText}</span>}
      </div>
    </div>
  );
}
