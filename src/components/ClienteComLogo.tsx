import {
  matchProjectToSystem,
  projectLogoUrl,
} from '../lib/systemLogos';
import styles from './ClienteComLogo.module.css';

function clienteLinhas(descricao: string): { primary: string; secondary: string | null } {
  const sys = matchProjectToSystem(descricao);
  if (sys) {
    const rest = descricao.replace(sys.nome, '').trim();
    return { primary: sys.nome, secondary: rest || null };
  }
  const m = descricao.match(/^(.+?)\s*(\([^)]+\))\s*$/);
  if (m) return { primary: m[1].trim(), secondary: m[2] };
  return { primary: descricao, secondary: null };
}

interface ClienteComLogoProps {
  descricao: string;
  compact?: boolean;
}

/** Cliente com logo — mesmo padrão do seletor da Fila. */
export function ClienteComLogo({ descricao, compact }: ClienteComLogoProps) {
  const { primary, secondary } = clienteLinhas(descricao);

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <span className={styles.logoWrap}>
        <img
          src={projectLogoUrl(descricao)}
          alt=""
          className={`${styles.logo} brand-logo`}
          aria-hidden
        />
      </span>
      <span className={styles.meta}>
        <span className={styles.primary}>{primary}</span>
        {secondary && <span className={styles.secondary}>{secondary}</span>}
      </span>
    </div>
  );
}
