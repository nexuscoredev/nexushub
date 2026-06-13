import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
    <TechShell minimal>
      <div className={styles.page}>
        <div className={styles.terminal}>
          <header className={styles.head}>
            <div className={styles.headLeft}>
              <span className="material-symbols-outlined" aria-hidden>
                shield_lock
              </span>
              <span className={styles.headTitle}>NEXUS_HUB</span>
            </div>
            <div className={styles.windowDots} aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </header>

          <div className={styles.divider} aria-hidden />

          <p className={styles.subline}>
            SECURE_ACCESS // equipe interna ·{' '}
            <Link to="/cliente/entrar" className={styles.clientLink}>
              NEXUS_CLIENT
            </Link>
          </p>

          {!configured && (
            <div className={styles.alert} role="alert">
              SUPABASE_NAO_CONFIGURADO — copie .env.example para .env.local
            </div>
          )}

          {error && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {error.toUpperCase().replace(/\s+/g, '_')}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="usuario">
                USUARIO
              </label>
              <input
                id="usuario"
                type="text"
                className={styles.fieldInput}
                autoComplete="username"
                placeholder="vinicius_/_rafael_/_felipe"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="password">
                CHAVE_ACESSO
              </label>
              <input
                id="password"
                type="password"
                className={styles.fieldInput}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className={styles.submit} disabled={loading || !configured}>
              {loading ? 'AUTENTICANDO…' : 'INICIAR_CONEXAO'}
            </button>
          </form>

          <footer className={styles.footer}>
            <a href="/site/home.html" className={styles.backLink}>
              ← VOLTAR_AO_SITE
            </a>
          </footer>
        </div>
      </div>
    </TechShell>
  );
}
