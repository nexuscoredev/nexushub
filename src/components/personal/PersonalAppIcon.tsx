import { TodoistIcon } from '../TodoistIcon';
import { TheNewsMark } from './TheNewsMark';
import { PcGuideMark } from './PersonalAppMarks';
import { PERSONAL_APP_ICON_PATHS } from '../../lib/personalAppIconOptions';
import type { PersonalAppIcon as PersonalAppIconDef } from '../../lib/personalApps';
import styles from './PersonalAppGrid.module.css';

interface PersonalAppIconProps {
  icon: PersonalAppIconDef;
  label: string;
}

export function PersonalAppIcon({ icon, label }: PersonalAppIconProps) {
  switch (icon.type) {
    case 'piggy':
      return (
        <img
          src="/img/personal/piggy.png"
          alt=""
          className={styles.piggyIcon}
          width={52}
          height={52}
          loading="lazy"
          decoding="async"
        />
      );
    case 'emoji':
      return (
        <span className={styles.emojiIcon} aria-hidden>
          {icon.value}
        </span>
      );
    case 'the-news':
      return <TheNewsMark className={styles.theNewsIcon} />;
    case 'drinks-carta':
      return (
        <img
          src={PERSONAL_APP_ICON_PATHS.drinks}
          alt=""
          className={styles.brandMarkImg}
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
        />
      );
    case 'adega':
      return (
        <img
          src={PERSONAL_APP_ICON_PATHS.adega}
          alt=""
          className={styles.brandMarkImg}
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
        />
      );
    case 'pc-guide':
      return <PcGuideMark className={styles.brandMarkSvg} />;
    case 'todoist':
      return <TodoistIcon className={styles.todoistIcon} />;
    case 'image':
      return (
        <img
          src={icon.src}
          alt=""
          className={styles.brandMarkImg}
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
        />
      );
    case 'material':
      return (
        <span
          className={`material-symbols-outlined ${styles.materialIcon} ${styles[`tone${icon.tone ?? 'cyan'}`]}`}
          aria-hidden
        >
          {icon.name}
        </span>
      );
    case 'letter':
      return <span className={styles.letterIcon}>{icon.value}</span>;
    default:
      return <span className={styles.fallbackIcon}>{label.charAt(0)}</span>;
  }
}
