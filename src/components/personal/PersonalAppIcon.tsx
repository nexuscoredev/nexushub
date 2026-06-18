import { TodoistIcon } from '../TodoistIcon';
import { TheNewsMark } from './TheNewsMark';
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
    case 'todoist':
      return <TodoistIcon className={styles.todoistIcon} />;
    case 'image':
      return (
        <img
          src={icon.src}
          alt=""
          className={styles.imageIcon}
          width={52}
          height={52}
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
