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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.moveActions}>
      {current !== 'implantacoes' && (
        <button
          type="button"
          className={styles.moveBtn}
          disabled={busy}
          onClick={() => void handleMove('implantacoes')}
        >
          → Implantações
        </button>
      )}
      {current !== 'mensalidades' && (
        <button
          type="button"
          className={styles.moveBtn}
          disabled={busy}
          onClick={() => void handleMove('mensalidades')}
        >
          → Mensalidades
        </button>
      )}
    </div>
  );
}
