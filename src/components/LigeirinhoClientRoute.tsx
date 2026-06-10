import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClienteLigeirinhoDocumentacaoPage } from '../pages/cliente/ClienteLigeirinhoDocumentacaoPage';

type LigeirinhoClientKind = 'hub' | 'parceiros' | 'documentacao';

export function LigeirinhoClientRoute({ report }: { report: LigeirinhoClientKind }) {
  const { clienteConta } = useAuth();

  if (clienteConta?.cliente?.slug !== 'ligeirinho') {
    return <Navigate to="/cliente" replace />;
  }

  if (report === 'parceiros') return <Navigate to="/cliente#parceiros" replace />;
  if (report === 'documentacao') return <ClienteLigeirinhoDocumentacaoPage />;

  return <Navigate to="/cliente#hub" replace />;
}
