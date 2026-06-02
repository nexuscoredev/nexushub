import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { formatDateTime } from '../lib/format';
import type { CalendarEvent } from '../types/database';

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
      setUseEmbed(Boolean(body.useEmbed));
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

      {useEmbed ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {(tab === 'combinado' || tab === 'rafael') && embedRafael && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 400 }}>
              <iframe title="Rafael Agenda" src={embedRafael} style={{ width: '100%', height: 420, border: 0 }} />
            </div>
          )}
          {(tab === 'combinado' || tab === 'vinicius') && embedVinicius && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 400 }}>
              <iframe title="Vinícius Agenda" src={embedVinicius} style={{ width: '100%', height: 420, border: 0 }} />
            </div>
          )}
        </div>
      ) : (
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
    </div>
  );
}
