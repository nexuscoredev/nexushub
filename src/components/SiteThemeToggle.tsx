import { useSiteTheme } from '../hooks/useSiteTheme';
import type { SiteThemeMode } from '../lib/siteTheme';
import styles from './SiteThemeToggle.module.css';

const OPTIONS: { mode: SiteThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Tema claro', icon: 'light_mode' },
  { mode: 'dark', label: 'Tema escuro', icon: 'dark_mode' },
  { mode: 'auto', label: 'Tema automático', icon: 'brightness_auto' },
];

export function SiteThemeToggle() {
  const { mode, setTheme } = useSiteTheme();

  return (
    <div className={styles.theme} role="group" aria-label="Tema">
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={mode === option.mode ? `${styles.btn} ${styles.btnActive}` : styles.btn}
          aria-pressed={mode === option.mode}
          aria-current={mode === option.mode ? 'true' : undefined}
          aria-label={option.label}
          title={option.label}
          onClick={() => setTheme(option.mode)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {option.icon}
          </span>
        </button>
      ))}
    </div>
  );
}
