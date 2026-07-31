import { formatBRL } from '../../lib/format';
import type { PersonalFinanceMacroSummary } from '../../lib/personalFinanceMacro';
import styles from './PersonalFinanceMacroHero.module.css';

interface PersonalFinanceMacroHeroProps {
  summary: PersonalFinanceMacroSummary;
  loading?: boolean;
}

const STATS = [
  {
    key: 'dividas',
    label: 'Dívidas atuais',
    sub: 'Saldo restante total',
    getValue: (s: PersonalFinanceMacroSummary) => s.totalDividasAtuais,
    negative: true,
  },
  {
    key: 'compromissos',
    label: 'Compromissos / mês',
    sub: 'Recorrentes + assinaturas',
    getValue: (s: PersonalFinanceMacroSummary) => s.compromissosMensais,
  },
  {
    key: 'receber',
    label: 'A receber / mês',
    sub: 'Valores mensais previstos',
    getValue: (s: PersonalFinanceMacroSummary) => s.totalAReceberMensal,
    getSub: (s: PersonalFinanceMacroSummary) =>
      s.totalParcelasAReceber > 0
        ? `${s.totalParcelasAReceber} parcela${s.totalParcelasAReceber === 1 ? '' : 's'} restantes`
        : 'Sem parcelas cadastradas',
  },
] as const;

export function PersonalFinanceMacroHero({ summary, loading }: PersonalFinanceMacroHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.primary}>
        <span className={styles.primaryLabel}>Saldo macro mensal</span>
        <strong
          className={`${styles.saldoValue} ${summary.saldoMacroMensal < 0 ? styles.saldoNegative : ''}`}
        >
          {loading ? '…' : formatBRL(summary.saldoMacroMensal)}
        </strong>
        <span className={styles.primaryHint}>A receber − compromissos fixos</span>
      </div>

      <div className={styles.secondary}>
        {STATS.map((stat) => (
          <div key={stat.key} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <strong
              className={`${styles.statValue} ${'negative' in stat && stat.negative ? styles.statNegative : ''}`}
            >
              {loading ? '…' : formatBRL(stat.getValue(summary))}
            </strong>
            <span className={styles.statSub}>
              {'getSub' in stat && stat.getSub
                ? stat.getSub(summary)
                : stat.sub}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
