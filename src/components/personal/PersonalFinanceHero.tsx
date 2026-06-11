import { formatBRL } from '../../lib/format';
import type { PessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import { VINICIUS_VR_MENSAL } from '../../lib/viniciusPersonalFinance';
import styles from './PersonalFinanceHero.module.css';

interface PersonalFinanceHeroProps {
  summary: PessoalFinanceSummary;
  loading?: boolean;
  monthKey: string;
  viniciusLayout?: boolean;
}

const SECONDARY_STATS = [
  { key: 'entradas', label: 'Receitas', getValue: (s: PessoalFinanceSummary) => s.entradas },
  { key: 'saidas', label: 'Gastos', getValue: (s: PessoalFinanceSummary) => s.saidas },
  { key: 'aPagar', label: 'A pagar', getValue: (s: PessoalFinanceSummary) => s.valorAPagar },
] as const;

export function PersonalFinanceHero({
  summary,
  loading,
  monthKey: _monthKey,
  viniciusLayout,
}: PersonalFinanceHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.primary}>
        <span className={styles.primaryLabel}>Saldo do mês</span>
        <strong
          className={`${styles.saldoValue} ${summary.saldo < 0 ? styles.saldoNegative : ''}`}
        >
          {loading ? '…' : formatBRL(summary.saldo)}
        </strong>
      </div>

      <div className={styles.secondary}>
        {SECONDARY_STATS.map((stat) => (
          <div key={stat.key} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <strong className={styles.statValue}>
              {loading ? '…' : formatBRL(stat.getValue(summary))}
            </strong>
          </div>
        ))}
        {viniciusLayout && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>VR ref.</span>
            <strong className={styles.statValue}>{formatBRL(VINICIUS_VR_MENSAL)}</strong>
          </div>
        )}
      </div>
    </header>
  );
}
