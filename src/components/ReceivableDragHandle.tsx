import { type DragEvent } from 'react';
import {
  setActiveReceivableDragId,
  setReceivableDragData,
} from '../lib/receivableDrag';
import styles from '../pages/FinanceiroPage.module.css';

interface ReceivableDragHandleProps {
  receivableId: string;
  label: string;
  onDragStateChange?: (dragging: boolean) => void;
}

export function ReceivableDragHandle({
  receivableId,
  label,
  onDragStateChange,
}: ReceivableDragHandleProps) {
  const onDragStart = (e: DragEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    setReceivableDragData(e.dataTransfer, receivableId);
    onDragStateChange?.(true);
  };

  const onDragEnd = () => {
    setActiveReceivableDragId(null);
    onDragStateChange?.(false);
  };

  return (
    <span
      className={styles.dragHandle}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title="Arraste para Implantações ou Mensalidades"
      aria-label={`Arrastar ${label}`}
    >
      ⋮⋮
    </span>
  );
}
