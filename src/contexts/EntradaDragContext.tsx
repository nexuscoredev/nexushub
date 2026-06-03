import { createContext, useContext, useState, type ReactNode } from 'react';
import type { EntradaSecao } from '../lib/financeCategories';

type EntradaDragContextValue = {
  onMoveReceivable: (receivableId: string, targetSecao: EntradaSecao) => Promise<void>;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  hoverDropSecao: EntradaSecao | null;
  setHoverDropSecao: (secao: EntradaSecao | null) => void;
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
  const [hoverDropSecao, setHoverDropSecao] = useState<EntradaSecao | null>(null);

  return (
    <EntradaDragContext.Provider
      value={{
        onMoveReceivable,
        draggingId,
        setDraggingId,
        hoverDropSecao,
        setHoverDropSecao,
      }}
    >
      {children}
    </EntradaDragContext.Provider>
  );
}

export function useEntradaDragOptional() {
  return useContext(EntradaDragContext);
}
