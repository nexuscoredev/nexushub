import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { TechShell } from '../components/TechShell';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { session, signIn, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
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
          <HubLogo size="md" variant="full" showSubtitle={false} />
          <div className={styles.header}>
            <span className={styles.badge}>Secure access</span>
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
            <div>
              <label className="label" htmlFor="usuario">
                Usuário
              </label>
              <input
                id="usuario"
                type="text"
                className="input"
                autoComplete="username"
                placeholder="Vinicius, Rafael ou Felipe"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !configured}>
              {loading ? 'Autenticando…' : 'Entrar no Hub'}
            </button>
          </form>

          <p className={styles.back}>
            <Link to="/">← Voltar ao início</Link>
          </p>
        </div>
      </div>
    </TechShell>
  );
}
