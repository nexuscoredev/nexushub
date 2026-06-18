import {
  PERSONAL_EXTERNAL_APPS,
  PERSONAL_INTERNAL_APPS,
  type PersonalAppIcon,
  type PersonalInternalAppId,
} from '../../lib/personalApps';
import { PersonalAppIcon as PersonalAppIconView } from './PersonalAppIcon';
import styles from './PersonalAppGrid.module.css';

interface PersonalAppGridProps {
  viniciusOnly: boolean;
  onOpenFinance: () => void;
  onOpenDrinks?: () => void;
}

function iconWrapClass(icon: PersonalAppIcon, internalId?: PersonalInternalAppId): string {
  const base = styles.iconWrap;
  if (internalId === 'finance') return `${base} ${styles.iconWrapFinance}`;
  if (internalId === 'drinks') return `${base} ${styles.iconWrapDrinks}`;
  if (icon.type === 'the-news') return `${base} ${styles.iconWrapTheNews}`;
  if (icon.type === 'material' && icon.tone === 'green') return `${base} ${styles.iconWrapGreen}`;
  return base;
}

export function PersonalAppGrid({ viniciusOnly, onOpenFinance, onOpenDrinks }: PersonalAppGridProps) {
  const internalApps = PERSONAL_INTERNAL_APPS.filter((app) => !app.viniciusOnly || viniciusOnly);
  const externalApps = PERSONAL_EXTERNAL_APPS.filter((app) => !app.viniciusOnly || viniciusOnly);

  const handleInternal = (id: PersonalInternalAppId) => {
    if (id === 'finance') onOpenFinance();
    if (id === 'drinks') onOpenDrinks?.();
  };

  return (
    <section className={styles.section} aria-labelledby="central-apps">
      <h3 id="central-apps" className={styles.title}>
        Central de apps
      </h3>
      <p className={styles.sub}>
        Tudo num só lugar — finanças, congregação, tarefas e trilha sonora.
      </p>

      <div className={styles.grid} role="list">
        {internalApps.map((app) => (
          <button
            key={app.id}
            type="button"
            className={styles.tile}
            role="listitem"
            onClick={() => handleInternal(app.id)}
            aria-label={app.subtitle ? `${app.label} — ${app.subtitle}` : app.label}
          >
            <span className={iconWrapClass(app.icon, app.id)}>
              <PersonalAppIconView icon={app.icon} label={app.label} />
            </span>
            <span className={styles.label}>{app.label}</span>
          </button>
        ))}

        {externalApps.map((app) => (
          <a
            key={app.id}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tile}
            role="listitem"
            aria-label={app.subtitle ? `${app.label} — ${app.subtitle}` : app.label}
            title={app.subtitle}
          >
            <span className={iconWrapClass(app.icon)}>
              <PersonalAppIconView icon={app.icon} label={app.label} />
            </span>
            <span className={styles.label}>{app.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
