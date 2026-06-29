import { PersonalAppIcon } from './PersonalAppIcon';
import type { PersonalAppIcon as PersonalAppIconType } from '../../lib/personalApps';
import styles from './PersonalAppBackLink.module.css';

const APPS_ICON = { type: 'material', name: 'apps', tone: 'cyan' } as const;

type PersonalAppBackLinkProps = {
  label?: string;
  onClick: () => void;
  ariaLabel?: string;
  icon?: PersonalAppIconType;
};

export function PersonalAppBackLink({
  label = 'Aplicativos',
  onClick,
  ariaLabel,
  icon,
}: PersonalAppBackLinkProps) {
  const resolvedIcon = icon ?? APPS_ICON;

  return (
    <button
      type="button"
      className={styles.backLink}
      onClick={onClick}
      aria-label={ariaLabel ?? `Voltar aos ${label.toLowerCase()}`}
    >
      <span className={styles.backLinkIcon}>
        <PersonalAppIcon icon={resolvedIcon} label={label} />
      </span>
      <span>← {label}</span>
    </button>
  );
}
