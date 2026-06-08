import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ClientProtectedRoute() {
  const { session, loading, configured, isCliente } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="info-banner" style={{ margin: '2rem' }}>
        Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.
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
    return <Navigate to="/cliente/entrar" state={{ from: location }} replace />;
  }

  if (!isCliente) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
