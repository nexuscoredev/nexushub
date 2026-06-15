import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadHubEcosystemHealth,
  type HealthCheck,
  type HealthStatus,
} from '../lib/hubSystemHealth';
import styles from './HubSystemHealthPanel.module.css';

function dotClass(status: HealthStatus): string {
  if (status === 'ok') return styles.dotOk;
  if (status === 'warn') return styles.dotWarn;
  return styles.dotError;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function HealthBadge({ check }: { check: HealthCheck }) {
  return (
    <span className={styles.badge} title={check.detail}>
      <span className={`${styles.dot} ${dotClass(check.status)}`} aria-hidden />
      <span>
        {check.label}: {check.detail}
      </span>
    </span>
  );
}

export function HubSystemHealthPanel() {
  const { session, profile } = useAuth();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadHubEcosystemHealth({ session, profile });
      setChecks(result.checks);
      setRefreshedAt(result.refreshedAt);
    } finally {
      setLoading(false);
    }
  }, [session, profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasError = checks.some((c) => c.status === 'error');

  return (
    <section className={styles.healthPanel} aria-labelledby="hub-health-title">
      <div className={styles.head}>
        <h2 id="hub-health-title" className={styles.label}>
          Integrações em uso
        </h2>
        <button
          type="button"
          className={`btn-ghost ${styles.refreshBtn}`}
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {loading && checks.length === 0 ? (
        <p className={styles.loading}>Verificando integrações…</p>
      ) : (
        <div className={styles.badges} role="list">
          {checks.map((check) => (
            <HealthBadge key={check.id} check={check} />
          ))}
        </div>
      )}

      <p className={styles.note}>
        {hasError
          ? 'Itens em vermelho precisam de atenção — verifique Supabase, sessão ou variáveis no servidor.'
          : 'Fonte: Supabase NEXUS Hub, APIs Vercel (Todoist, ping de sistemas) e sessão da equipe.'}
      </p>

      {refreshedAt ? (
        <p className={styles.updated}>Atualizado às {formatTime(refreshedAt)}</p>
      ) : null}
    </section>
  );
}
