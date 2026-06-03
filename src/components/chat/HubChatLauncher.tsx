import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChatFloat } from '../../contexts/ChatFloatContext';
import { hubChatTotalNaoLidas, hubChatTabelasIndisponiveis } from '../../lib/hubChat';
import { supabase } from '../../lib/supabase';
import type { HubProfile } from '../../types/database';
import { HubChatWidget } from './HubChatWidget';
import styles from './HubChat.module.css';

const FAB_POS_KEY = 'nexus-hub-chat-fab-pos-v1';

type FabPos = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseFabPos(raw: string | null): FabPos | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { x?: unknown; y?: unknown };
    const x = Number(v.x);
    const y = Number(v.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  } catch {
    return null;
  }
}

export function HubChatLauncher({ profile }: { profile: HubProfile }) {
  const { open, setOpen, pendingUserId, clearPendingUserId } = useChatFloat();
  const [naoLidas, setNaoLidas] = useState(0);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [fabPos, setFabPos] = useState<FabPos | null>(() =>
    typeof window !== 'undefined' ? parseFabPos(localStorage.getItem(FAB_POS_KEY)) : null,
  );
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);

  const atualizarBadge = useCallback(async () => {
    try {
      setNaoLidas(await hubChatTotalNaoLidas());
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
      .subscribe();
    return () => {
      if (supabase) void supabase.removeChannel(ch);
    };
  }, [atualizarBadge]);

  useEffect(() => {
    if (!fabPos) return;
    try {
      localStorage.setItem(FAB_POS_KEY, JSON.stringify(fabPos));
    } catch {
      /* ignore */
    }
  }, [fabPos]);

  const handleFabPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (open) return;
      const el = fabRef.current;
      if (!el) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const base = fabPos ?? { x: rect.left, y: rect.top };
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: base.x,
        baseY: base.y,
        moved: false,
      };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [fabPos, open],
  );

  const handleFabPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragRef.current;
    const el = fabRef.current;
    if (!st || !el || e.pointerId !== st.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) >= 6) st.moved = true;
    const rect = el.getBoundingClientRect();
    setFabPos({
      x: clamp(st.baseX + dx, 8, Math.max(8, window.innerWidth - rect.width - 8)),
      y: clamp(st.baseY + dy, 8, Math.max(8, window.innerHeight - rect.height - 8)),
    });
  }, []);

  const handleFabPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragRef.current;
    const el = fabRef.current;
    if (!st || !el || e.pointerId !== st.pointerId) return;
    dragRef.current = null;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const handleFabClick = useCallback(() => {
    if (dragRef.current?.moved) return;
    setOpen(true);
  }, [setOpen]);

  function fechar() {
    setOpen(false);
    clearPendingUserId();
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.hcLayer}>
      {!open ? (
        <button
          type="button"
          ref={fabRef}
          className={styles.fab}
          style={
            fabPos
              ? ({ left: fabPos.x, top: fabPos.y, right: 'auto', bottom: 'auto' } as React.CSSProperties)
              : undefined
          }
          aria-label={naoLidas > 0 ? `Chat — ${naoLidas} não lidas` : 'Abrir chat interno'}
          aria-haspopup="dialog"
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onPointerCancel={handleFabPointerUp}
          onClick={handleFabClick}
        >
          {naoLidas > 0 ? <span className={styles.fabBadge}>{naoLidas > 99 ? '99+' : naoLidas}</span> : null}
          <img src="/img/favicon.png" alt="" className={styles.fabLogo} decoding="async" />
        </button>
      ) : (
        <HubChatWidget
          profile={profile}
          pendingPeerId={pendingUserId}
          onPendingPeerHandled={clearPendingUserId}
          onFechar={fechar}
          onNaoLidasChange={setNaoLidas}
        />
      )}
    </div>,
    document.body,
  );
}
