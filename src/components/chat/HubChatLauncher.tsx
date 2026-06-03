import { useCallback, useEffect, useState } from 'react';
import { useChatFloat } from '../../contexts/ChatFloatContext';
import { hubChatTotalNaoLidas, hubChatTabelasIndisponiveis } from '../../lib/hubChat';
import { supabase } from '../../lib/supabase';
import type { HubProfile } from '../../types/database';
import { HubChatWidget } from './HubChatWidget';
import styles from './HubChat.module.css';

export function HubChatLauncher({ profile }: { profile: HubProfile }) {
  const { open, setOpen, pendingUserId, clearPendingUserId } = useChatFloat();
  const [naoLidas, setNaoLidas] = useState(0);

  const atualizarBadge = useCallback(async () => {
    try {
      const n = await hubChatTotalNaoLidas();
      setNaoLidas(n);
    } catch (e) {
      if (!hubChatTabelasIndisponiveis(e)) console.error(e);
      setNaoLidas(0);
    }
  }, []);

  useEffect(() => {
    void atualizarBadge();
    const t = window.setInterval(() => void atualizarBadge(), 45_000);
    return () => window.clearInterval(t);
  }, [atualizarBadge]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('hub-chat-launcher-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hub_chat_mensagens' },
        () => void atualizarBadge(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hub_chat_participantes' },
        () => void atualizarBadge(),
      )
      .subscribe();
    return () => {
      if (supabase) void supabase.removeChannel(ch);
    };
  }, [atualizarBadge]);

  function fechar() {
    setOpen(false);
    clearPendingUserId();
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.fab} ${open ? styles.fabHidden : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Abrir chat interno"
        title="Chat interno"
        tabIndex={open ? -1 : 0}
        aria-hidden={open}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {naoLidas > 0 ? (
          <span className={styles.fabBadge}>{naoLidas > 9 ? '9+' : naoLidas}</span>
        ) : null}
      </button>
      {open ? (
        <HubChatWidget
          profile={profile}
          pendingPeerId={pendingUserId}
          onPendingPeerHandled={clearPendingUserId}
          onFechar={fechar}
          onNaoLidasChange={setNaoLidas}
        />
      ) : null}
    </>
  );
}
