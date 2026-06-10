import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClienteLigeirinhoPage } from '../pages/cliente/ClienteLigeirinhoPage';

export function LigeirinhoClientRoute() {
  const { clienteConta } = useAuth();

  if (clienteConta?.cliente?.slug !== 'ligeirinho') {
    return <Navigate to="/cliente" replace />;
  }

  return <ClienteLigeirinhoPage />;
}
