import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { isDemoFullscreen, requestDemoFullscreen } from '../lib/demoFullscreen';
import { NEXUS_LOGO_ALT, NEXUS_LOGO_URL } from '../lib/nexusBrand';
import styles from './DemoLogoReveal.module.css';

interface DemoLogoRevealProps {
  accent?: string;
  label?: string;
  onEnter: () => void;
}

const HOLD_MS = 3200;
const EXIT_MS = 900;

export function DemoLogoReveal({ accent = '#22c55e', label, onEnter }: DemoLogoRevealProps) {
  const enteredRef = useRef(false);
  const [phase, setPhase] = useState<'intro' | 'exit'>('intro');
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    onEnter();
  };

  const finishWithFullscreen = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    void (async () => {
      if (!isDemoFullscreen()) {
        await requestDemoFullscreen(document.documentElement);
      }
      onEnter();
    })();
  };

  useEffect(() => {
    if (reducedMotion) {
      const id = window.setTimeout(finish, 180);
      return () => window.clearTimeout(id);
    }

    const exitTimer = window.setTimeout(() => {
      setPhase('exit');
      window.setTimeout(finish, EXIT_MS);
    }, HOLD_MS);

    return () => window.clearTimeout(exitTimer);
  }, [reducedMotion]);

  return (
    <div
      className={`${styles.overlay} ${phase === 'exit' ? styles.overlayExit : ''}`}
      role="presentation"
      aria-hidden
      style={{ '--reveal-accent': accent } as CSSProperties}
    >
      <div className={styles.void} />

      <div className={styles.rays} aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={styles.ray} style={{ '--ray-i': i } as CSSProperties} />
        ))}
      </div>

      <div className={styles.shards} aria-hidden>
        <span className={styles.shard} />
        <span className={styles.shard} />
      </div>

      <div className={styles.stage}>
        <div className={styles.logoShell}>
          <div className={styles.logoGlow} />
          <svg className={styles.logoStroke} viewBox="0 0 64 64" fill="none" aria-hidden>
            <circle className={styles.strokeCircle} cx="32" cy="32" r="28" pathLength="1" />
          </svg>
          <div className={styles.logoFill}>
            <img src={NEXUS_LOGO_URL} alt={NEXUS_LOGO_ALT} className={styles.logoMark} />
          </div>
        </div>

        <p className={styles.wordmark}>NEXUS</p>
        <p className={styles.subtitle}>Demonstração</p>
        {label ? <p className={styles.demoLabel}>{label}</p> : null}
      </div>

      <button type="button" className={styles.enterBtn} onClick={finishWithFullscreen}>
        <span className="material-symbols-outlined" aria-hidden>
          play_arrow
        </span>
        Iniciar demonstração
      </button>
    </div>
  );
}
