import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requireFinanceiro?: boolean;
  requireGestao?: boolean;
  requirePessoal?: boolean;
  requireDocumentacao?: boolean;
}

export function ProtectedRoute({
  requireFinanceiro = false,
  requireGestao = false,
  requirePessoal = false,
  requireDocumentacao = false,
}: ProtectedRouteProps) {
  const {
    session,
    user,
    profile,
    loading,
    configured,
    podeFinanceiroAgenda,
    podeGestao,
    podePessoal,
    podeDocumentacao,
    isCliente,
    isEquipe,
  } = useAuth();
  const location = useLocation();
  const profilePending = Boolean(session && user && profile === null);

  if (!configured) {
    return (
      <div className="info-banner" style={{ margin: '2rem' }}>
        Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local
        para acessar o painel.
      </div>
    );
  }

  if (loading || profilePending) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Carregando sessão…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isCliente && !isEquipe) {
    return <Navigate to="/cliente" replace />;
  }

  if (!isEquipe) {
    return <Navigate to="/login" replace />;
  }

  if (requireFinanceiro && !podeFinanceiroAgenda) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireGestao && !podeGestao) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePessoal && !podePessoal) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireDocumentacao && !podeDocumentacao) {
    return <Navigate to="/sistemas" replace />;
  }

  return <Outlet />;
}
