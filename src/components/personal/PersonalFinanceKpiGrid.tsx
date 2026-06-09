import type { CSSProperties } from 'react';
import { formatBRL } from '../../lib/format';
import {
  percentualContasPagas,
  totalFixosPessoal,
  totalVariaveisPessoal,
} from '../../lib/personalFinanceVisuals';
import type { HubPersonalTransaction } from '../../types/database';
import styles from './PersonalFinanceKpiGrid.module.css';

export type PersonalKpiValues = {
  entradas: number;
  saidas: number;
  saldo: number;
};

interface PersonalFinanceKpiGridProps {
  values: PersonalKpiValues;
  rows: HubPersonalTransaction[];
  loading?: boolean;
}

const CARDS = [
  {
    key: 'saldo' as const,
    label: 'Saldo do mês',
    sub: 'Receitas − gastos',
    icon: '/img/finance/recebido.svg',
    tone: 'gold',
  },
  {
    key: 'entradas' as const,
    label: 'Receitas',
    sub: 'Entradas registradas',
    icon: '/img/finance/entradas.svg',
    tone: 'green',
  },
  {
    key: 'saidas' as const,
    label: 'Gastos',
    sub: 'Saídas totais',
    icon: '/img/finance/saidas.svg',
    tone: 'rose',
  },
];

export function PersonalFinanceKpiGrid({ values, rows, loading }: PersonalFinanceKpiGridProps) {
  const fixos = totalFixosPessoal(rows);
  const variaveis = totalVariaveisPessoal(rows);
  const pagasPct = percentualContasPagas(rows);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {CARDS.map(({ key, label, sub, icon, tone }) => (
          <article key={key} className={`${styles.card} ${styles[`tone_${tone}`]}`}>
            <div className={styles.cardIconWrap}>
              <img src={icon} alt="" className={styles.cardIcon} aria-hidden />
            </div>
            <div className={styles.cardBody}>
              <span className={styles.cardLabel}>{label}</span>
              <strong
                className={`${styles.cardValue} ${key === 'saldo' && values.saldo < 0 ? styles.negative : ''}`}
              >
                {loading ? '…' : formatBRL(values[key])}
              </strong>
              <span className={styles.cardSub}>{sub}</span>
            </div>
          </article>
        ))}

        <article className={`${styles.card} ${styles.tone_indigo}`}>
          <div className={styles.cardIconWrap}>
            <img src="/img/finance/mensalidade.svg" alt="" className={styles.cardIcon} aria-hidden />
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardLabel}>Compromissos fixos</span>
            <strong className={styles.cardValue}>{loading ? '…' : formatBRL(fixos)}</strong>
            <span className={styles.cardSub}>Residencial + carro + rotina</span>
          </div>
        </article>

        <article className={`${styles.card} ${styles.tone_coral}`}>
          <div className={styles.cardIconWrap}>
            <img src="/img/personal/grupo-variaveis.svg" alt="" className={styles.cardIconRound} aria-hidden />
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardLabel}>Variáveis</span>
            <strong className={styles.cardValue}>{loading ? '…' : formatBRL(variaveis)}</strong>
            <span className={styles.cardSub}>Cartões e extras do mês</span>
          </div>
        </article>

        <article className={`${styles.card} ${styles.tone_sky}`}>
          <div className={styles.progressRing} style={{ '--pct': `${pagasPct}%` } as CSSProperties}>
            <span className={styles.progressValue}>{loading ? '…' : `${pagasPct}%`}</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardLabel}>Contas pagas</span>
            <strong className={styles.cardValue}>{loading ? '…' : `${pagasPct}%`}</strong>
            <span className={styles.cardSub}>Checklist do mês</span>
          </div>
        </article>
      </div>
    </div>
  );
}
