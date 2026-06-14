import { SiteThemeToggle } from './SiteThemeToggle';
import styles from './LoginThemeToggle.module.css';

export function LoginThemeToggle() {
  return (
    <div className={styles.bar}>
      <SiteThemeToggle />
    </div>
  );
}
