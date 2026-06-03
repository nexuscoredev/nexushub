import { useEffect, useId, useState } from 'react';
import { NavIcon } from './NavIcon';
import styles from './PromptNameModal.module.css';

export interface PromptNameModalProps {
  open: boolean;
  title: string;
  fieldLabel: string;
  placeholder?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (name: string) => void | Promise<void>;
}

export function PromptNameModal({
  open,
  title,
  fieldLabel,
  placeholder,
  confirmLabel = 'Ok',
  onClose,
  onConfirm,
}: PromptNameModalProps) {
  const titleId = useId();
  const inputId = useId();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  const handleSubmit = async () => {
    const name = value.trim();
    if (!name) {
      setError('Informe um nome.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={`btn-ghost ${styles.closeBtn}`}
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar"
          >
            <NavIcon name="close" />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={inputId}>
            {fieldLabel}
          </label>
          <input
            id={inputId}
            className="input"
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
            disabled={submitting}
            autoFocus
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSubmit()}
            disabled={submitting || !value.trim()}
          >
            {submitting ? 'Salvando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
