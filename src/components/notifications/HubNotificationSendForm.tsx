import { useEffect, useState, type FormEvent } from 'react';
import {
  hubNotificationsEnviar,
  hubNotificationsListarDestinatarios,
} from '../../lib/hubNotifications';
import type { HubNotificationDestino } from '../../types/hubNotifications';
import type { HubProfile } from '../../types/database';
import styles from './HubNotificationSendForm.module.css';

export function HubNotificationSendForm() {
  const [destino, setDestino] = useState<HubNotificationDestino>('todos');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [usuarios, setUsuarios] = useState<Pick<HubProfile, 'id' | 'nome' | 'cargo' | 'email'>[]>(
    [],
  );
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingUsers(true);
      try {
        const list = await hubNotificationsListarDestinatarios();
        if (!cancelled) setUsuarios(list);
      } catch (e) {
        if (!cancelled) {
          setFeedback({
            ok: false,
            msg: e instanceof Error ? e.message : 'Erro ao carregar equipe.',
          });
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (destino === 'usuario' && !destinatarioId) {
      setFeedback({ ok: false, msg: 'Selecione um destinatário.' });
      return;
    }

    setSending(true);
    try {
      const count = await hubNotificationsEnviar(
        titulo,
        corpo,
        destino === 'usuario' ? destinatarioId : null,
      );
      setFeedback({
        ok: true,
        msg:
          destino === 'usuario'
            ? 'Notificação enviada.'
            : `Notificação enviada para ${count} membro(s) da equipe.`,
      });
      setTitulo('');
      setCorpo('');
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : 'Falha ao enviar.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
      <p className={styles.lead}>
        Envie avisos in-app para um membro da equipe ou para todos os utilizadores ativos.
      </p>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Destino</legend>
        <label className={styles.radio}>
          <input
            type="radio"
            name="destino"
            value="todos"
            checked={destino === 'todos'}
            onChange={() => setDestino('todos')}
          />
          <span>Toda a equipe</span>
        </label>
        <label className={styles.radio}>
          <input
            type="radio"
            name="destino"
            value="usuario"
            checked={destino === 'usuario'}
            onChange={() => setDestino('usuario')}
          />
          <span>Utilizador específico</span>
        </label>
      </fieldset>

      {destino === 'usuario' ? (
        <label className={styles.label}>
          <span>Destinatário</span>
          <select
            className={styles.select}
            value={destinatarioId}
            onChange={(e) => setDestinatarioId(e.target.value)}
            disabled={loadingUsers || sending}
            required
          >
            <option value="">Selecione…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.cargo})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className={styles.label}>
        <span>Título</span>
        <input
          className={styles.input}
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          required
          disabled={sending}
          placeholder="Ex.: Manutenção programada"
        />
      </label>

      <label className={styles.label}>
        <span>Mensagem</span>
        <textarea
          className={styles.textarea}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={4}
          maxLength={2000}
          required
          disabled={sending}
          placeholder="Texto da notificação…"
        />
      </label>

      {feedback ? (
        <p className={feedback.ok ? styles.success : styles.error} role="status">
          {feedback.msg}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={sending || loadingUsers}>
        {sending ? 'Enviando…' : 'Enviar notificação'}
      </button>
    </form>
  );
}
