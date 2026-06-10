import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClienteLigeirinhoDocumentacaoPage } from '../pages/cliente/ClienteLigeirinhoDocumentacaoPage';
import { ClienteLigeirinhoPage } from '../pages/cliente/ClienteLigeirinhoPage';
import { ClienteLigeirinhoParceirosPage } from '../pages/cliente/ClienteLigeirinhoParceirosPage';

type LigeirinhoClientKind = 'hub' | 'parceiros' | 'documentacao';

export function LigeirinhoClientRoute({ report }: { report: LigeirinhoClientKind }) {
  const { clienteConta } = useAuth();

  if (clienteConta?.cliente?.slug !== 'ligeirinho') {
    return <Navigate to="/cliente" replace />;
  }

  if (report === 'parceiros') return <ClienteLigeirinhoParceirosPage />;
  if (report === 'documentacao') return <ClienteLigeirinhoDocumentacaoPage />;

  return <ClienteLigeirinhoPage />;
}
