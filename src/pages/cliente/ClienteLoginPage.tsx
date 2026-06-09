import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ClientThemeToggle } from '../../components/client/ClientThemeToggle';
import { HubLogo } from '../../components/HubLogo';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ClienteLoginPage.module.css';

export function ClienteLoginPage() {
  const { session, signInCliente, configured, isCliente, isEquipe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/cliente';

  const [usuario, setUsuario] = useState('');
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
      await signInCliente(usuario, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nx-client-shell ${styles.shell}`}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <HubLogo size="sm" showSubtitle subtitleText="Client" surface="site" />
          <small>Área do cliente</small>
        </div>
        <div className={styles.topbarRight}>
          <ClientThemeToggle />
          <div className={styles.access} aria-label="Acesso à plataforma">
          <a href="/site/home.html" className={styles.accessBtn}>
            Site
          </a>
          <span className={`${styles.accessBtn} ${styles.accessBtnActive}`} aria-current="page">
            NexusClient
          </span>
          <Link to="/login" className={styles.accessBtn}>
            NexusHub
          </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>NexusClient</span>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.lead}>Acompanhe processos, contratos e solicitações do seu projeto.</p>
          </header>

          {!configured && (
            <div className={styles.error}>Supabase não configurado neste ambiente.</div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cliente-usuario">
                Usuário
              </label>
              <input
                id="cliente-usuario"
                className={styles.input}
                type="text"
                autoComplete="username"
                placeholder="rgambiental"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
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
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>NEXUS Technology Systems</span>
      </footer>
    </div>
  );
}
