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
        <svg className={styles.piggy} viewBox="0 0 120 120" aria-hidden>
          <ellipse cx="60" cy="68" rx="42" ry="36" fill="#f9a8c9" />
          <ellipse cx="60" cy="72" rx="34" ry="28" fill="#fbcfe8" />
          <circle cx="38" cy="52" r="14" fill="#f9a8c9" />
          <circle cx="82" cy="52" r="14" fill="#f9a8c9" />
          <circle cx="38" cy="52" r="7" fill="#f472b6" />
          <circle cx="82" cy="52" r="7" fill="#f472b6" />
          <ellipse cx="60" cy="62" rx="22" ry="18" fill="#fda4c6" />
          <circle cx="50" cy="58" r="3" fill="#4a2030" />
          <circle cx="70" cy="58" r="3" fill="#4a2030" />
          <ellipse cx="60" cy="68" rx="5" ry="4" fill="#e879a9" />
          <path
            d="M88 62 Q98 58 102 52 Q106 58 98 66 Z"
            fill="#f9a8c9"
          />
          <rect x="48" y="78" width="24" height="20" rx="6" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
          <text x="60" y="92" textAnchor="middle" fontSize="14" fontWeight="700" fill="#b45309" fontFamily="system-ui, sans-serif">
            $
          </text>
          <ellipse cx="28" cy="88" rx="8" ry="6" fill="#f9a8c9" />
          <ellipse cx="92" cy="88" rx="8" ry="6" fill="#f9a8c9" />
        </svg>
        <span className={styles.label}>Finanças</span>
      </button>
      <p className={styles.hint}>Toque no porquinho quando quiser cuidar das contas</p>
    </div>
  );
}
