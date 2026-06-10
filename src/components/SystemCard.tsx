import { Link } from 'react-router-dom';
import { resolveSystemUrl, SYSTEM_PROJECT_PAGES, systemLogoUrl } from '../lib/systemLogos';
import type { HubSystem } from '../types/database';
import styles from './SystemCard.module.css';

interface SystemCardProps {
  system: HubSystem;
  /** link = card inteiro clicável; button = só botão abre URL */
  variant?: 'link' | 'button';
}

export function SystemCard({ system, variant = 'button' }: SystemCardProps) {
  const logo = systemLogoUrl(system.id);
  const href = resolveSystemUrl(system.id, system.url, system.nome);
  const projectPath = SYSTEM_PROJECT_PAGES[system.id];

  const body = (
    <>
      <div className={styles.logoWrap}>
        <img src={logo} alt="" className={`${styles.logo} brand-logo brand-logo-active`} aria-hidden />
      </div>
      <h3 className={styles.title}>{system.nome}</h3>
      <p className={styles.desc}>{system.descricao}</p>
      {variant === 'button' && (
        <div className={styles.actions}>
          {projectPath ? (
            <Link to={projectPath} className={`btn-ghost ${styles.action}`}>
              Status do projeto
            </Link>
          ) : null}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary ${styles.action}`}
          >
            Abrir sistema
          </a>
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
