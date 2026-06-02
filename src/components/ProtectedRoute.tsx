import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requireFinanceiro?: boolean;
  requireGestao?: boolean;
}

export function ProtectedRoute({
  requireFinanceiro = false,
  requireGestao = false,
}: ProtectedRouteProps) {
  const { session, loading, configured, podeFinanceiroAgenda, podeGestao } =
    useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="info-banner" style={{ margin: '2rem' }}>
        Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local
        para acessar o painel.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Carregando sessão…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireFinanceiro && !podeFinanceiroAgenda) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireGestao && !podeGestao) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
