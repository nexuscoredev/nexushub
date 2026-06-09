import { FormEvent, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HubLogo } from '../../components/HubLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useMetalPointer } from '../../hooks/useMetalPointer';
import styles from './ClienteLoginPage.module.css';

export function ClienteLoginPage() {
  const shellRef = useRef<HTMLDivElement>(null);
  useMetalPointer(shellRef);
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
    <div className={styles.shell} ref={shellRef}>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <HubLogo size="lg" showSubtitle subtitleText="Client" surface="site" centered />
          </div>

          <header className={styles.header}>
            <span className={styles.eyebrow}>NexusClient</span>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.lead}>Acompanhe processos, contratos e solicitações do seu projeto.</p>
          </header>

          {!configured && (
            <div className={styles.error} style={{ marginTop: '1rem' }}>
              Supabase não configurado neste ambiente.
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cliente-email">
                E-mail
              </label>
              <input
                id="cliente-email"
                className={styles.input}
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cliente-password">
                Senha
              </label>
              <input
                id="cliente-password"
                className={styles.input}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submit} disabled={loading || !configured}>
              {loading ? 'Entrando…' : 'Entrar no NexusClient'}
            </button>
          </form>

          <div className={styles.footer}>
            <a href="/site/home.html" className={styles.footerLink}>
              Voltar ao site
            </a>
            <Link to="/login" className={styles.footerLink}>
              NexusHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
