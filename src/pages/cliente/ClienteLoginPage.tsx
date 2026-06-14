import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginThemeToggle } from '../../components/LoginThemeToggle';
import { HubLogo } from '../../components/HubLogo';
import { TechShell } from '../../components/TechShell';
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

  const hubSessionActive = Boolean(session && isEquipe && !isCliente);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInCliente(usuario.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TechShell variant="client">
      <LoginThemeToggle accent="client" />
      <div className={`nx-client-shell ${styles.page}`}>
        <div className={`card ${styles.card}`}>
          <div className={styles.cardGlow} aria-hidden />
          <div className={styles.logoWrap}>
            <HubLogo size="lg" variant="full" centered subtitleText="Client" accent="client" />
          </div>
          <div className={styles.header}>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>
              Acompanhe processos, contratos e solicitações do seu projeto.
            </p>
          </div>

          {!configured && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              Supabase não configurado neste ambiente.
            </div>
          )}

          {hubSessionActive && (
            <div className={styles.hubNotice}>
              Você está logado no <Link to="/dashboard">NexusHub</Link>. Para o portal do cliente,
              entre abaixo com credenciais NexusClient — são áreas separadas.
            </div>
          )}

          {error && (
            <div className="error-banner" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            <div className={styles.field}>
              <label className={styles.fieldShell} htmlFor="cliente-usuario">
                <span className={`material-symbols-outlined ${styles.fieldIcon}`} aria-hidden>
                  alternate_email
                </span>
                <input
                  id="cliente-usuario"
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
              <label className={styles.fieldShell} htmlFor="cliente-password">
                <span className={`material-symbols-outlined ${styles.fieldIcon}`} aria-hidden>
                  lock
                </span>
                <input
                  id="cliente-password"
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
              {loading ? 'Autenticando…' : 'Entrar'}
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
