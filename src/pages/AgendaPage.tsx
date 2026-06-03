import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { formatDateTime } from '../lib/format';
import type { CalendarEvent } from '../types/database';
import styles from './AgendaPage.module.css';

type AgendaTab = 'combinado' | 'rafael' | 'vinicius';

export function AgendaPage() {
  const [tab, setTab] = useState<AgendaTab>('combinado');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [embedRafael, setEmbedRafael] = useState('');
  const [embedVinicius, setEmbedVinicius] = useState('');
  const [useEmbed, setUseEmbed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/google/calendar?view=${tab}`);
      const body = (await res.json()) as {
        events?: CalendarEvent[];
        embedRafael?: string;
        embedVinicius?: string;
        useEmbed?: boolean;
        error?: string;
        configured?: boolean;
      };
      if (!res.ok) throw new Error(body.error ?? 'Falha ao carregar agenda');
      if (body.configured === false) {
        setError(
          'Google Calendar não configurado. Defina GOOGLE_SERVICE_ACCOUNT_JSON ou URLs de embed na Vercel.',
        );
        setEvents([]);
        return;
      }
      setEvents(body.events ?? []);
      setEmbedRafael(body.embedRafael ?? '');
      setEmbedVinicius(body.embedVinicius ?? '');
      setUseEmbed(Boolean(body.useEmbed || body.embedVinicius || body.embedRafael));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    tab === 'combinado'
      ? events
      : events.filter((e) => e.calendar === tab);

  const showRafaelEmbed = Boolean(embedRafael) && (tab === 'combinado' || tab === 'rafael');
  const showViniciusEmbed = Boolean(embedVinicius) && (tab === 'combinado' || tab === 'vinicius');
  const showEmbedView = showRafaelEmbed || showViniciusEmbed;

  return (
    <div>
      <PageHeader
        badge="Calendar"
        title="Agenda"
        subtitle="Rafael e Vinícius — visão mútua das agendas."
      />

      <div className="tabs">
        {(
          [
            ['combinado', 'Combinado'],
            ['rafael', 'Rafael'],
            ['vinicius', 'Vinícius'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => void load()}>
          Atualizar
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

      {showEmbedView && (
        <div className={styles.embedGrid}>
          {showRafaelEmbed && (
            <div className={`card ${styles.embedCard}`}>
              <div className={styles.embedHeader}>Rafael</div>
              <iframe
                title="Agenda Rafael"
                src={embedRafael}
                className={styles.embedFrame}
              />
            </div>
          )}
          {showViniciusEmbed && (
            <div className={`card ${styles.embedCard}`}>
              <div className={styles.embedHeader}>Vinícius</div>
              <iframe
                title="Agenda Vinícius"
                src={embedVinicius}
                className={styles.embedFrame}
              />
            </div>
          )}
        </div>
      )}

      {!showEmbedView && (
        <>
          {loading && <p style={{ color: 'var(--muted)' }}>Carregando eventos…</p>}
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((ev) => (
              <li key={ev.id} className="card" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{ev.title}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {formatDateTime(ev.start)}
                      {ev.end ? ` — ${formatDateTime(ev.end)}` : ''}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {ev.calendar === 'rafael' ? 'Rafael' : ev.calendar === 'vinicius' ? 'Vinícius' : ''}
                    </span>
                  </div>
                  {ev.htmlLink && (
                    <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      Google Calendar
                    </a>
                  )}
                </div>
              </li>
            ))}
            {!loading && filtered.length === 0 && (
              <li className="info-banner">Nenhum evento no período.</li>
            )}
          </ul>
        </>
      )}

      {showEmbedView && !useEmbed && events.length > 0 && (
        <section className={styles.eventFallback}>
          <h2 className={styles.eventFallbackTitle}>Próximos eventos (API)</h2>
          <ul className={styles.eventList}>
            {filtered.slice(0, 8).map((ev) => (
              <li key={ev.id} className={styles.eventItem}>
                <strong>{ev.title}</strong>
                <span>{formatDateTime(ev.start)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
