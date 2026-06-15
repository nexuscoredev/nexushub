import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resolveSystemUrl, systemDocPath, systemLogoUrl } from '../lib/systemLogos';
import type { HubSystem } from '../types/database';
import styles from './SystemCard.module.css';

interface SystemCardProps {
  system: HubSystem;
  /** link = card inteiro clicável; button = só botão abre URL */
  variant?: 'link' | 'button';
  onDetalhes?: (system: HubSystem) => void;
}

export function SystemCard({ system, variant = 'button', onDetalhes }: SystemCardProps) {
  const { podeDocumentacao } = useAuth();
  const logo = systemLogoUrl(system.id);
  const href = resolveSystemUrl(system.id, system.url, system.nome);
  const docPath = podeDocumentacao ? systemDocPath(system.id) : null;

  const body = (
    <>
      <div className={styles.logoWrap}>
        <img src={logo} alt="" className={`${styles.logo} brand-logo brand-logo-active`} aria-hidden />
      </div>
      <h3 className={styles.title}>{system.nome}</h3>
      <p className={styles.desc}>{system.descricao}</p>
      {variant === 'button' && (
        <div className={styles.actions}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary ${styles.action}`}
          >
            Abrir sistema
          </a>
          {onDetalhes ? (
            <button
              type="button"
              className={`btn-ghost ${styles.action}`}
              onClick={() => onDetalhes(system)}
            >
              Detalhes
            </button>
          ) : null}
          {docPath ? (
            <Link to={docPath} className={`btn-ghost ${styles.action}`}>
              Documentação
            </Link>
          ) : null}
        </div>
      )}
    </>
  );

  if (variant === 'link') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`card ${styles.card} ${styles.linkCard}`}
      >
        {body}
      </a>
    );
  }

  return <article className={`card ${styles.card}`}>{body}</article>;
}
