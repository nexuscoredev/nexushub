import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HubLogo } from '../components/HubLogo';
import { useAuth } from '../contexts/AuthContext';
import { CARGOS } from '../lib/cargos';
import { TEAM_HINT_EMAILS } from '../lib/acesso';
import type { HubCargo } from '../types/database';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { session, signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<HubCargo>('Desenvolvedor');
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
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, { nome: nome.trim(), cargo });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`card ${styles.card}`}>
        <HubLogo />
        <h1 className="page-title" style={{ marginTop: '1.5rem' }}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Acesso ao NEXUS Hub
        </p>

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
          {mode === 'signup' && (
            <>
              <div>
                <label className="label" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  className="input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="cargo">
                  Cargo
                </label>
                <select
                  id="cargo"
                  className="input"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value as HubCargo)}
                >
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !configured}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'login' ? (
            <>
              Primeiro acesso?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Entrar
              </button>
            </>
          )}
        </p>

        <p className={styles.hint}>
          Equipe:{' '}
          {TEAM_HINT_EMAILS.map((e) => (
            <code key={e}>{e} </code>
          ))}
          — senha padrão documentada no README (seed).
        </p>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            ← Voltar
          </Link>
        </p>
      </div>
    </div>
  );
}
