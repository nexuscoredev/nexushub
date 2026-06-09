import { formatBRL } from '../../lib/format';
import type { PessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import { VINICIUS_VR_MENSAL } from '../../lib/viniciusPersonalFinance';
import styles from './PersonalFinanceHero.module.css';

interface PersonalFinanceHeroProps {
  summary: PessoalFinanceSummary;
  loading?: boolean;
}

export function PersonalFinanceHero({ summary, loading }: PersonalFinanceHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.badge}>Financeiro pessoal</span>
        <h2 className={styles.title}>Seu painel premium</h2>
        <p className={styles.sub}>
          Totais recalculados ao adicionar, editar, remover ou marcar contas como pagas.
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Gastos totais</span>
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
          <div className={styles.statDivider} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>Saldo</span>
            <strong
              className={`${styles.statValue} ${summary.saldo < 0 ? styles.statNegative : ''}`}
            >
              {loading ? '…' : formatBRL(summary.saldo)}
            </strong>
          </div>
          <div className={styles.statDivider} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>VR ref.</span>
            <strong className={styles.statValue}>{formatBRL(VINICIUS_VR_MENSAL)}</strong>
          </div>
        </div>
      </div>
      <div className={styles.visual} aria-hidden>
        <img src="/img/personal/hero-wallet.svg" alt="" className={styles.heroImg} />
        <img src="/img/finance/entradas.svg" alt="" className={styles.floatIcon} />
        <img src="/img/finance/saidas.svg" alt="" className={styles.floatIcon2} />
      </div>
    </header>
  );
}
