import { useRef } from 'react';
import type { EntradaSecao } from '../lib/financeCategories';
import { useEntradaDragOptional } from '../contexts/EntradaDragContext';
import styles from '../pages/FinanceiroPage.module.css';

interface ReceivableDragHandleProps {
  receivableId: string;
  label: string;
}

export function ReceivableDragHandle({ receivableId, label }: ReceivableDragHandleProps) {
  const ctx = useEntradaDragOptional();
  const handleRef = useRef<HTMLButtonElement>(null);
  const movedRef = useRef(false);

  if (!ctx) return null;

  const finishDrag = (clientX: number, clientY: number) => {
    ctx.setDraggingId(null);
    ctx.setHoverDropSecao(null);
    if (!movedRef.current) return;

    const el = document.elementFromPoint(clientX, clientY);
    const zone = el?.closest<HTMLElement>('[data-drop-secao]');
    const secao = zone?.dataset.dropSecao as EntradaSecao | undefined;
    if (secao) void ctx.onMoveReceivable(receivableId, secao);
  };

  return (
    <button
      ref={handleRef}
      type="button"
      className={styles.dragHandle}
      title={`Arrastar ${label} para Implantações ou Mensalidades`}
      aria-label={`Arrastar ${label}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        movedRef.current = false;
        ctx.setDraggingId(receivableId);
        handleRef.current?.setPointerCapture(e.pointerId);

        const onMove = (ev: PointerEvent) => {
          if (Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) > 4) {
            movedRef.current = true;
          }
          const over = document.elementFromPoint(ev.clientX, ev.clientY);
          const zone = over?.closest<HTMLElement>('[data-drop-secao]');
          const secao = zone?.dataset.dropSecao as EntradaSecao | undefined;
          ctx.setHoverDropSecao(secao ?? null);
        };

        const onUp = (ev: PointerEvent) => {
          handleRef.current?.releasePointerCapture(ev.pointerId);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          finishDrag(ev.clientX, ev.clientY);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }}
    >
      ⋮⋮
    </button>
  );
}
