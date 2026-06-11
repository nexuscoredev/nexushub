import { useEffect, useId, type ReactNode } from 'react';
import { NavIcon } from '../NavIcon';
import styles from './PersonalFinanceModal.module.css';

interface PersonalFinanceModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function splitModalTitle(title: string): { eyebrow: string | null; headline: string } {
  const sep = title.indexOf(' · ');
  if (sep === -1) return { eyebrow: null, headline: title };
  return {
    eyebrow: title.slice(0, sep).trim(),
    headline: title.slice(sep + 3).trim() || title,
  };
}

export function PersonalFinanceModal({ open, title, onClose, children }: PersonalFinanceModalProps) {
  const titleId = useId();
  const { eyebrow, headline } = splitModalTitle(title);

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
          <div className={styles.headerCopy}>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h2 id={titleId} className={styles.title}>
              {headline}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <NavIcon name="close" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
