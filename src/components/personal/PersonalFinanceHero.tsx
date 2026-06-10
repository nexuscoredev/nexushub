import { formatBRL } from '../../lib/format';
import { formatMonthLabel } from '../../lib/personalFinanceMonth';
import type { PessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import { VINICIUS_VR_MENSAL } from '../../lib/viniciusPersonalFinance';
import styles from './PersonalFinanceHero.module.css';

interface PersonalFinanceHeroProps {
  summary: PessoalFinanceSummary;
  loading?: boolean;
  monthKey: string;
  viniciusLayout?: boolean;
}

export function PersonalFinanceHero({
  summary,
  loading,
  monthKey,
  viniciusLayout,
}: PersonalFinanceHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <h2 className={styles.title}>Resumo · {formatMonthLabel(monthKey)}</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Saldo</span>
            <strong
              className={`${styles.statValue} ${styles.statHighlight} ${summary.saldo < 0 ? styles.statNegative : ''}`}
            >
              {loading ? '…' : formatBRL(summary.saldo)}
            </strong>
          </div>
          <div className={styles.statDivider} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>Receitas</span>
            <strong className={styles.statValue}>
              {loading ? '…' : formatBRL(summary.entradas)}
            </strong>
          </div>
          <div className={styles.statDivider} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>Gastos</span>
            <strong className={styles.statValue}>
              {loading ? '…' : formatBRL(summary.saidas)}
            </strong>
          </div>
          <div className={styles.statDivider} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>A pagar</span>
            <strong className={styles.statValue}>
              {loading ? '…' : formatBRL(summary.valorAPagar)}
            </strong>
          </div>
          {viniciusLayout && (
            <>
              <div className={styles.statDivider} aria-hidden />
              <div className={styles.stat}>
                <span className={styles.statLabel}>VR ref.</span>
                <strong className={styles.statValue}>{formatBRL(VINICIUS_VR_MENSAL)}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
