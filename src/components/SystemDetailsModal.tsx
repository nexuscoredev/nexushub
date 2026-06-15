import { useCallback, useEffect, useState } from 'react';
import { loadSystemHealth, type HealthCheck, type HealthStatus } from '../lib/hubSystemHealth';
import { resolveSystemUrl } from '../lib/systemLogos';
import { supabase } from '../lib/supabase';
import type { HubSystem } from '../types/database';
import styles from './SystemDetailsModal.module.css';

interface SystemDetailsModalProps {
  system: HubSystem | null;
  open: boolean;
  onClose: () => void;
}

function dotClass(status: HealthStatus): string {
  if (status === 'ok') return styles.dotOk;
  if (status === 'warn') return styles.dotWarn;
  return styles.dotError;
}

export function SystemDetailsModal({ system, open, onClose }: SystemDetailsModalProps) {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!system) return;
    setLoading(true);
    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      setChecks(await loadSystemHealth(system, token));
    } finally {
      setLoading(false);
    }
  }, [system]);

  useEffect(() => {
    if (!open || !system) return;
    void refresh();
  }, [open, system, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !system) return null;

  const href = resolveSystemUrl(system.id, system.url, system.nome);

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-details-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="system-details-title" className={styles.title}>
              {system.nome}
            </h2>
            <p className={styles.subtitle}>Status e integrações deste produto NEXUS.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
          {loading && checks.length === 0 ? (
            <p className={styles.loading}>Verificando sistema…</p>
          ) : (
            <ul className={styles.list}>
              {checks.map((check) => (
                <li key={check.id} className={styles.item}>
                  <span className={`${styles.dot} ${dotClass(check.status)}`} aria-hidden />
                  <div>
                    <p className={styles.itemLabel}>{check.label}</p>
                    <p className={styles.itemDetail}>{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Abrir sistema
          </a>
        </div>
      </div>
    </div>
  );
}
