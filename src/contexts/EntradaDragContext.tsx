import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EntradaSecao } from '../lib/financeCategories';
import { resolveEntradaDropSecao } from '../lib/resolveEntradaDropSecao';
import { setActiveReceivableDragId } from '../lib/receivableDrag';

const BODY_DRAG_CLASS = 'nexushub-entrada-dragging';

type EntradaDragContextValue = {
  onMoveReceivable: (receivableId: string, targetSecao: EntradaSecao) => Promise<void>;
  draggingId: string | null;
  hoverDropSecao: EntradaSecao | null;
  beginDrag: (receivableId: string) => void;
  endDrag: () => void;
  setHoverDropSecao: (secao: EntradaSecao | null) => void;
  updateHoverFromPoint: (clientX: number, clientY: number) => void;
  getHoverDropSecao: () => EntradaSecao | null;
};

const EntradaDragContext = createContext<EntradaDragContextValue | null>(null);

export function EntradaDragProvider({
  children,
  onMoveReceivable,
}: {
  children: ReactNode;
  onMoveReceivable: (receivableId: string, targetSecao: EntradaSecao) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverDropSecao, setHoverDropSecaoState] = useState<EntradaSecao | null>(null);
  const hoverRef = useRef<EntradaSecao | null>(null);

  const setHoverDropSecao = useCallback((secao: EntradaSecao | null) => {
    hoverRef.current = secao;
    setHoverDropSecaoState(secao);
  }, []);

  const beginDrag = useCallback(
    (receivableId: string) => {
      setDraggingId(receivableId);
      setActiveReceivableDragId(receivableId);
      document.body.classList.add(BODY_DRAG_CLASS);
    },
    [],
  );

  const endDrag = useCallback(() => {
    setDraggingId(null);
    setHoverDropSecao(null);
    setActiveReceivableDragId(null);
    document.body.classList.remove(BODY_DRAG_CLASS);
  }, [setHoverDropSecao]);

  const updateHoverFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      setHoverDropSecao(resolveEntradaDropSecao(clientX, clientY));
    },
    [setHoverDropSecao],
  );

  const getHoverDropSecao = useCallback(() => hoverRef.current, []);

  return (
    <EntradaDragContext.Provider
      value={{
        onMoveReceivable,
        draggingId,
        hoverDropSecao,
        beginDrag,
        endDrag,
        setHoverDropSecao,
        updateHoverFromPoint,
        getHoverDropSecao,
      }}
    >
      {children}
    </EntradaDragContext.Provider>
  );
}

export function useEntradaDragOptional() {
  return useContext(EntradaDragContext);
}
