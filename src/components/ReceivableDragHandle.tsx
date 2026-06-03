import { useEntradaDragOptional } from '../contexts/EntradaDragContext';
import styles from '../pages/FinanceiroPage.module.css';

interface ReceivableDragHandleProps {
  receivableId: string;
  label: string;
}

export function ReceivableDragHandle({ receivableId, label }: ReceivableDragHandleProps) {
  const ctx = useEntradaDragOptional();
  if (!ctx) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    ctx.beginDrag(receivableId);

    const onMove = (ev: PointerEvent) => {
      ctx.updateHoverFromPoint(ev.clientX, ev.clientY);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const target = ctx.getHoverDropSecao();
      ctx.endDrag();
      if (target) void ctx.onMoveReceivable(receivableId, target);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.dragHandle}
      title={`Arrastar ${label} para Implantações ou Mensalidades`}
      aria-label={`Arrastar ${label}`}
      onPointerDown={onPointerDown}
    >
      ⋮⋮
    </div>
  );
}
