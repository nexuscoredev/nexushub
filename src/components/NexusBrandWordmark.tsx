import styles from './HubLogo.module.css';

type NexusBrandAccent = 'hub' | 'client';

interface NexusBrandWordmarkProps {
  subtitleText: string;
  accent?: NexusBrandAccent;
  withIcon?: boolean;
  markImgClassName?: string;
}

/** Texto da marca NEXUS + subtítulo — mesmas classes visuais do HubLogo. */
export function NexusBrandWordmark({
  subtitleText,
  accent = 'hub',
  withIcon = false,
  markImgClassName,
}: NexusBrandWordmarkProps) {
  const accentClass = accent === 'client' ? styles.clientMark : '';

  return (
    <>
      {withIcon ? (
        <img
          src="/img/favicon.png"
          alt=""
          className={markImgClassName ?? styles.markImg}
          aria-hidden
        />
      ) : null}
      <div className={styles.brand}>
        <span className={styles.wordmark}>NEXUS</span>
        <span className={`${styles.hubMark} ${accentClass}`.trim()}>{subtitleText}</span>
      </div>
    </>
  );
}
