import type { ReactNode } from 'react';
import { PageHeader } from '../PageHeader';
import styles from './PersonalAppShell.module.css';

export type PersonalAppVariant = 'adega' | 'drinks' | 'coffee';

type PersonalAppShellProps = {
  title: string;
  subtitle: string;
  mobileTitle?: string;
  onBack: () => void;
  variant: PersonalAppVariant;
  children: ReactNode;
};

export function PersonalAppShell({
  title,
  subtitle,
  mobileTitle,
  onBack,
  variant,
  children,
}: PersonalAppShellProps) {
  const shellTitle = mobileTitle ?? title;

  return (
    <div
      className={`${styles.shell} ${styles[`shell_${variant}`]}`}
      data-personal-app={variant}
    >
      <div className={styles.desktopTop}>
        <PageHeader compact title={title} subtitle={subtitle} />
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Cantinho
        </button>
      </div>

      {variant !== 'coffee' ? (
        <header className={styles.mobileChrome}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={onBack}
            aria-label="Voltar ao cantinho"
          >
            ←
          </button>
          <div className={styles.mobileChromeTitles}>
            <h1 className={styles.mobileChromeTitle}>{shellTitle}</h1>
            <p className={styles.mobileChromeSubtitle}>{subtitle}</p>
          </div>
        </header>
      ) : null}

      <div className={styles.appBody}>{children}</div>
    </div>
  );
}
