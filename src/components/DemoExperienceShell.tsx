import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  exitDemoFullscreen,
  isDemoFullscreen,
  lockDemoViewport,
  requestDemoFullscreen,
} from '../lib/demoFullscreen';
import { DemoLogoReveal } from './DemoLogoReveal';
import styles from './DemoExperienceShell.module.css';

interface DemoExperienceShellProps {
  accent?: string;
  label?: string;
  children: ReactNode;
}

export function DemoExperienceShell({ accent = '#22c55e', label, children }: DemoExperienceShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealDone, setRevealDone] = useState(false);
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    lockDemoViewport(true);

    return () => {
      lockDemoViewport(false);

      const active =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      if (active === rootRef.current || active === document.documentElement) {
        void exitDemoFullscreen();
      }
    };
  }, []);

  const enterDemo = useCallback(async () => {
    if (!isDemoFullscreen()) {
      const ok = await requestDemoFullscreen(rootRef.current);
      if (!ok) {
        await requestDemoFullscreen(document.documentElement);
      }
    }
    setRevealDone(true);
  }, []);

  return (
    <div ref={rootRef} className={styles.root} style={{ '--reveal-accent': accent } as CSSProperties}>
      <div
        className={`${styles.content} ${revealDone ? (reducedMotion ? styles.contentInstant : styles.contentVisible) : ''}`}
      >
        {children}
      </div>

      {!revealDone ? (
        <DemoLogoReveal accent={accent} label={label} onEnter={() => void enterDemo()} />
      ) : null}
    </div>
  );
}
