import { useState } from 'react';
import styles from './PiggyFinanceButton.module.css';

interface PiggyFinanceButtonProps {
  onLaunch: () => void;
}

export function PiggyFinanceButton({ onLaunch }: PiggyFinanceButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'launch' | 'fly'>('idle');

  const handleClick = () => {
    if (phase !== 'idle') return;
    setPhase('launch');
    window.setTimeout(() => setPhase('fly'), 320);
    window.setTimeout(() => onLaunch(), 720);
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.piggyBtn} ${phase === 'launch' ? styles.launch : ''} ${phase === 'fly' ? styles.fly : ''}`}
        onClick={handleClick}
        aria-label="Abrir financeiro pessoal"
        disabled={phase !== 'idle'}
      >
        <span className={styles.sparkles} aria-hidden>
          <span className={styles.spark} />
          <span className={styles.spark} />
          <span className={styles.spark} />
        </span>
        <img
          src="/img/personal/piggy.png"
          alt=""
          className={styles.piggy}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
        />
        <span className={styles.label}>Finanças</span>
      </button>
      <p className={styles.hint}>Toque no porquinho quando quiser cuidar das contas</p>
    </div>
  );
}
