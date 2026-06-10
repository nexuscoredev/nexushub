import { useEffect, useId, type ReactNode } from 'react';
import { NavIcon } from '../NavIcon';
import styles from './PersonalFinanceModal.module.css';

interface PersonalFinanceModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function PersonalFinanceModal({ open, title, onClose, children }: PersonalFinanceModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={`btn-ghost ${styles.closeBtn}`} onClick={onClose} aria-label="Fechar">
            <NavIcon name="close" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
