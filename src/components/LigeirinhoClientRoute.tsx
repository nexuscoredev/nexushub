import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClienteLigeirinhoPage } from '../pages/cliente/ClienteLigeirinhoPage';
import { ClienteLigeirinhoParceirosPage } from '../pages/cliente/ClienteLigeirinhoParceirosPage';

type LigeirinhoReportKind = 'hub' | 'parceiros';

export function LigeirinhoClientRoute({ report }: { report: LigeirinhoReportKind }) {
  const { clienteConta } = useAuth();

  if (clienteConta?.cliente?.slug !== 'ligeirinho') {
    return <Navigate to="/cliente" replace />;
  }

  if (report === 'parceiros') {
    return <ClienteLigeirinhoParceirosPage />;
  }

  return <ClienteLigeirinhoPage />;
}
