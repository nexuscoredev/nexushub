import { useCallback, useEffect, useRef, useState } from 'react';
import { NavIcon } from '../NavIcon';
import { formatDateTime } from '../../lib/format';
import {
  hubNotificationsContarNaoLidas,
  hubNotificationsIndisponiveis,
  hubNotificationsListar,
  hubNotificationsMarcarLida,
  hubNotificationsMarcarTodasLidas,
} from '../../lib/hubNotifications';
import { supabase } from '../../lib/supabase';
import type { HubNotificationLista } from '../../types/hubNotifications';
import styles from './HubNotifications.module.css';

interface HubNotificationsBellProps {
  userId: string;
}

export function HubNotificationsBell({ userId }: HubNotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [items, setItems] = useState<HubNotificationLista[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const atualizarBadge = useCallback(async () => {
    try {
      setNaoLidas(await hubNotificationsContarNaoLidas());
    } catch (e) {
      if (!hubNotificationsIndisponiveis(e)) console.error(e);
      setNaoLidas(0);
    }
  }, []);

  const carregarLista = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await hubNotificationsListar());
      await atualizarBadge();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar notificações.';
      if (hubNotificationsIndisponiveis(e)) {
        setError(msg);
        setItems([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [atualizarBadge]);

  useEffect(() => {
    void atualizarBadge();
  }, [atualizarBadge, userId]);

  useEffect(() => {
    if (!supabase) return;

    const ch = supabase
      .channel(`hub-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hub_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          void atualizarBadge();
          if (open) void carregarLista();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hub_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          void atualizarBadge();
          if (open) void carregarLista();
        },
      )
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(ch);
    };
  }, [userId, open, atualizarBadge, carregarLista]);

  useEffect(() => {
    if (!open) return;
    void carregarLista();
  }, [open, carregarLista]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const handleToggle = () => setOpen((v) => !v);

  const handleMarcarLida = async (id: string) => {
    try {
      await hubNotificationsMarcarLida(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      await atualizarBadge();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await hubNotificationsMarcarTodasLidas();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
      setNaoLidas(0);
    } catch (e) {
      console.error(e);
    }
  };

  const badgeLabel = naoLidas > 99 ? '99+' : String(naoLidas);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.bellBtn} ${open ? styles.bellBtnOpen : ''}`}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={naoLidas > 0 ? `Notificações — ${naoLidas} não lidas` : 'Notificações'}
        title="Notificações"
      >
        <NavIcon name="bell" className={styles.bellIcon} />
        {naoLidas > 0 ? (
          <span className={styles.badge} aria-hidden>
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Notificações">
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Notificações</span>
            <button
              type="button"
              className={styles.markAllBtn}
              onClick={() => void handleMarcarTodas()}
              disabled={naoLidas === 0 || loading}
            >
              Marcar todas
            </button>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.list}>
            {loading && items.length === 0 ? (
              <p className={styles.empty}>Carregando…</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>Nenhuma notificação.</p>
            ) : (
              items.map((item) => {
                const unread = !item.read_at;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.item} ${unread ? styles.itemUnread : ''}`}
                    onClick={() => {
                      if (unread) void handleMarcarLida(item.id);
                    }}
                  >
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <time className={styles.itemTime} dateTime={item.created_at}>
                        {formatDateTime(item.created_at)}
                      </time>
                    </div>
                    <p className={styles.itemBody}>{item.body}</p>
                    {item.sender?.nome ? (
                      <div className={styles.itemMeta}>
                        {item.sender.nome}
                        {item.sender.cargo ? ` · ${item.sender.cargo}` : ''}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
