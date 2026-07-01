import styles from './HubLogo.module.css';
import { NEXUS_LOGO_URL } from '../lib/nexusBrand';
import { NexusBrandWordmark } from './NexusBrandWordmark';
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
  /** Cor do subtítulo: Hub (azul) ou Client (violeta) */
  accent?: 'hub' | 'client';
}

export function HubLogo({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Hub',
  variant = 'mark',
  centered = false,
  surface = 'hub',
  accent = 'hub',
}: HubLogoProps) {
  const resolvedSize = variant === 'full' && size === 'md' ? 'lg' : size;
  const sizeClass = styles[resolvedSize];

  return (
    <div
      className={`${styles.logo} ${sizeClass} ${styles.mark} ${centered ? styles.centered : ''} ${surface === 'site' ? styles.siteSurface : ''}`}
    >
      {showSubtitle ? (
        <NexusBrandWordmark
          subtitleText={subtitleText}
          accent={accent}
          withIcon
          markImgClassName={styles.markImg}
        />
      ) : (
        <>
          <img src={NEXUS_LOGO_URL} alt="" className={styles.markImg} aria-hidden />
          <div className={styles.brand}>
            <span className={styles.wordmark}>NEXUS</span>
          </div>
        </>
      )}
    </div>
  );
}

