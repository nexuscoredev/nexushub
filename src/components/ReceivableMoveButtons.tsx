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
    if (busy) return;
    if (current === target) {
      alert(
        target === 'implantacoes'
          ? 'Este registro já está em Implantações.'
          : 'Este registro já está em Mensalidades.',
      );
      return;
    }
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
      {current !== 'implantacoes' && (
        <button
          type="button"
          className={styles.moveBtnPrimary}
          disabled={busy}
          onClick={() => void handleMove('implantacoes')}
        >
          ↑ Implantações
        </button>
      )}
      {current !== 'mensalidades' && (
        <button
          type="button"
          className={styles.moveBtnPrimary}
          disabled={busy}
          onClick={() => void handleMove('mensalidades')}
        >
          ↓ Mensalidades
        </button>
      )}
    </div>
  );
}
