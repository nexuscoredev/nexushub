import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HubLogo } from '../../components/HubLogo';
import { TechShell } from '../../components/TechShell';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ClienteLoginPage.module.css';

export function ClienteLoginPage() {
  const { session, signInCliente, configured, isCliente, isEquipe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/cliente';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session && isCliente) {
    return <Navigate to={from} replace />;
  }

  if (session && isEquipe) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInCliente(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TechShell>
      <div className={styles.page}>
        <div className={`card ${styles.card}`}>
          <div className={styles.cardGlow} aria-hidden />
          <HubLogo size="md" showSubtitle={false} />
          <div className={styles.header}>
            <span className={styles.badge}>Portal do cliente</span>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Acompanhe processos, contratos e solicitações</p>
          </div>

          {!configured && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              Supabase não configurado neste ambiente.
            </div>
          )}

          {error && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            <div>
              <label className="label" htmlFor="cliente-email">
                E-mail
              </label>
              <input
                id="cliente-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="cliente-password">
                Senha
              </label>
              <input
                id="cliente-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !configured}>
              {loading ? 'Entrando…' : 'Acessar portal'}
            </button>
          </form>

          <div className={styles.footer}>
            <Link to="/site/home.html">Voltar ao site</Link>
            <Link to="/login">Acesso equipe (Nexus Hub)</Link>
          </div>
        </div>
      </div>
    </TechShell>
  );
}
