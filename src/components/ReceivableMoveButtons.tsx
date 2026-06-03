import { useState } from 'react';
import {
  secaoEntradaReceivable,
  type EntradaSecao,
} from '../lib/financeCategories';
import type { HubFinanceReceivable } from '../types/database';
import styles from '../pages/FinanceiroPage.module.css';

interface ReceivableMoveButtonsProps {
  row: HubFinanceReceivable;
  onMove: (row: HubFinanceReceivable, target: EntradaSecao) => Promise<void>;
}

export function ReceivableMoveButtons({ row, onMove }: ReceivableMoveButtonsProps) {
  const [busy, setBusy] = useState(false);
  const current = secaoEntradaReceivable(row);

  const handleMove = async (target: EntradaSecao) => {
    if (busy || current === target) return;
    setBusy(true);
    try {
      await onMove(row, target);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao mover registro.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.moveActions} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={styles.moveBtnPrimary}
        disabled={busy || current === 'implantacoes'}
        title="Mover para Implantações (seção de cima)"
        onClick={() => void handleMove('implantacoes')}
      >
        ↑ Implantações
      </button>
      <button
        type="button"
        className={styles.moveBtnPrimary}
        disabled={busy || current === 'mensalidades'}
        title="Mover para Mensalidades (seção de baixo)"
        onClick={() => void handleMove('mensalidades')}
      >
        ↓ Mensalidades
      </button>
    </div>
  );
}
