import { NavIcon } from './NavIcon';
import styles from './AppUpdatePrompt.module.css';

interface AppUpdatePromptProps {
  onUpdate: () => void;
  onDismiss?: () => void;
}

export function AppUpdatePrompt({ onUpdate, onDismiss }: AppUpdatePromptProps) {
  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <div className={styles.content}>
        <NavIcon name="refresh" className={styles.icon} />
        <div className={styles.text}>
          <strong className={styles.title}>Nova versão disponível</strong>
          <span className={styles.desc}>
            O Hub foi atualizado. Atualize agora para carregar a versão mais recente.
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {onDismiss ? (
          <button type="button" className="btn-ghost" onClick={onDismiss}>
            Depois
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={onUpdate}>
          Atualizar agora
        </button>
      </div>
    </div>
  );
}
