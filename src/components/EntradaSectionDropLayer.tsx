import type { EntradaSecao } from '../lib/financeCategories';
import { useEntradaDragOptional } from '../contexts/EntradaDragContext';
import styles from '../pages/FinanceiroPage.module.css';

interface EntradaSectionDropLayerProps {
  secao: EntradaSecao;
}

/** Camada transparente que captura o ponteiro enquanto um recebimento está sendo arrastado. */
export function EntradaSectionDropLayer({ secao }: EntradaSectionDropLayerProps) {
  const ctx = useEntradaDragOptional();
  if (!ctx?.draggingId) return null;

  const activate = () => ctx.setHoverDropSecao(secao);

  return (
    <div
      className={styles.dropCaptureLayer}
      data-drop-secao={secao}
      aria-hidden
      onPointerEnter={activate}
      onPointerMove={activate}
    />
  );
}
