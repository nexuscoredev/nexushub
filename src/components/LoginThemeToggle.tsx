import { SiteThemeToggle } from './SiteThemeToggle';
import styles from './LoginThemeToggle.module.css';

type LoginThemeToggleProps = {
  accent?: 'hub' | 'client';
};

export function LoginThemeToggle({ accent = 'hub' }: LoginThemeToggleProps) {
  return (
    <div className={styles.bar}>
      <SiteThemeToggle accent={accent} />
    </div>
  );
}
