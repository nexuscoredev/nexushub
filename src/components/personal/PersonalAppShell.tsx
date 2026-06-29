import type { ReactNode } from 'react';
import { PageHeader } from '../PageHeader';
import styles from './PersonalAppShell.module.css';

export type PersonalAppVariant = 'adega' | 'drinks' | 'coffee';

type PersonalAppShellProps = {
  title: string;
  subtitle: string;
  mobileTitle?: string;
  onBack: () => void;
  backLabel?: string;
  backIcon?: ReactNode;
  backAriaLabel?: string;
  variant: PersonalAppVariant;
  children: ReactNode;
};

export function PersonalAppShell({
  title,
  subtitle,
  mobileTitle,
  onBack,
  backLabel = 'Cantinho',
  backIcon,
  backAriaLabel,
  variant,
  children,
}: PersonalAppShellProps) {
  const shellTitle = mobileTitle ?? title;
  const ariaLabel = backAriaLabel ?? `Voltar: ${backLabel}`;

  return (
    <div
      className={`${styles.shell} ${styles[`shell_${variant}`]}`}
      data-personal-app={variant}
    >
      <div className={styles.desktopTop}>
        <PageHeader compact title={title} subtitle={subtitle} />
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label={ariaLabel}
        >
          {backIcon ? <span className={styles.backBtnIcon}>{backIcon}</span> : null}
          <span>← {backLabel}</span>
        </button>
      </div>

      {variant !== 'coffee' ? (
        <header className={styles.mobileChrome}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={onBack}
            aria-label={ariaLabel}
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
