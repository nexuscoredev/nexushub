import type { EntradaSecao } from '../lib/financeCategories';
import { useEntradaDragOptional } from '../contexts/EntradaDragContext';
import styles from '../pages/FinanceiroPage.module.css';

interface EntradaSectionDropLayerProps {
  secao: EntradaSecao;
  label: string;
}

/** Camada no topo da seção + botão visível para soltar (arrastar ou clicar). */
export function EntradaSectionDropLayer({ secao, label }: EntradaSectionDropLayerProps) {
  const ctx = useEntradaDragOptional();
  if (!ctx?.draggingId) return null;

  const activate = () => ctx.setHoverDropSecao(secao);

  const dropHere = () => {
    const id = ctx.draggingId;
    ctx.endDrag();
    if (id) void ctx.onMoveReceivable(id, secao);
  };

  return (
    <>
      <div
        className={styles.dropCaptureLayer}
        data-drop-secao={secao}
        aria-hidden
        onPointerEnter={activate}
        onPointerMove={activate}
      />
      <button type="button" className={styles.dropBar} onClick={dropHere}>
        Soltar em {label}
      </button>
    </>
  );
}
