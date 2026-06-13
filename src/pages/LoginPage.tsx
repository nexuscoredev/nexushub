import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { TechShell } from '../components/TechShell';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { session, signIn, configured, isCliente, isEquipe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session && isCliente && !isEquipe) {
    return <Navigate to="/cliente" replace />;
  }

  if (session && isEquipe) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(usuario.trim(), password);
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
          <div className={styles.logoWrap}>
            <HubLogo size="lg" variant="full" centered />
          </div>
          <div className={styles.header}>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Acesso restrito à equipe NEXUS</p>
          </div>

          {!configured && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              Supabase não configurado. Copie .env.example para .env.local.
            </div>
          )}

          {error && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldShell} htmlFor="usuario">
                <span className={`material-symbols-outlined ${styles.fieldIcon}`} aria-hidden>
                  alternate_email
                </span>
                <input
                  id="usuario"
                  type="text"
                  className={styles.fieldInput}
                  autoComplete="username"
                  placeholder="Usuário"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldShell} htmlFor="password">
                <span className={`material-symbols-outlined ${styles.fieldIcon}`} aria-hidden>
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  className={styles.fieldInput}
                  autoComplete="current-password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !configured}>
              {loading ? 'Autenticando…' : 'Entrar no Hub'}
            </button>
          </form>

          <p className={styles.back}>
            <a href="/site/home.html">← Voltar ao site</a>
          </p>
        </div>
      </div>
    </TechShell>
  );
}
