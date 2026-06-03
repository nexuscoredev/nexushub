import {
  projectDisplayName,
  projectLogoUrl,
  sortProjectsByClient,
} from '../lib/systemLogos';
import type { TodoistProject } from '../types/todoist';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  projects: TodoistProject[];
  value: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
}

export function ProjectSelector({ projects, value, onChange, disabled }: ProjectSelectorProps) {
  const sorted = sortProjectsByClient(projects);

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Cliente</span>
      <div className={styles.track} role="listbox" aria-label="Cliente / projeto Todoist">
        {sorted.map((p) => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`${styles.option} ${active ? styles.optionActive : ''}`}
              onClick={() => onChange(p.id)}
              disabled={disabled}
              title={p.name}
            >
              <span className={styles.logoWrap}>
                <img
                  src={projectLogoUrl(p.name)}
                  alt=""
                  className={styles.logo}
                  aria-hidden
                />
              </span>
              <span className={styles.name}>{projectDisplayName(p.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
