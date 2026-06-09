import type { CSSProperties } from 'react';
import { formatBRL } from '../../lib/format';
import type { PessoalFinanceSummary } from '../../lib/pessoalFinanceSummary';
import styles from './PersonalFinanceKpiGrid.module.css';

interface PersonalFinanceKpiGridProps {
  summary: PessoalFinanceSummary;
  loading?: boolean;
}

export function PersonalFinanceKpiGrid({ summary, loading }: PersonalFinanceKpiGridProps) {
  const cards = [
    {
      key: 'saldo',
      label: 'Saldo do mês',
      sub: 'Receitas − gastos',
      value: formatBRL(summary.saldo),
      negative: summary.saldo < 0,
      icon: '/img/finance/recebido.svg',
      tone: 'gold',
    },
    {
      key: 'entradas',
      label: 'Receitas',
      sub: 'Entradas registradas',
      value: formatBRL(summary.entradas),
      icon: '/img/finance/entradas.svg',
      tone: 'green',
    },
    {
      key: 'saidas',
      label: 'Gastos totais',
      sub: 'Fixos + variáveis + outros',
      value: formatBRL(summary.saidas),
      icon: '/img/finance/saidas.svg',
      tone: 'rose',
    },
    {
      key: 'pago',
      label: 'Já pago',
      sub: 'Contas marcadas + outros gastos',
      value: formatBRL(summary.valorPago),
      icon: '/img/finance/recebido.svg',
      tone: 'green',
    },
    {
      key: 'apagar',
      label: 'A pagar',
      sub: 'Contas ainda em aberto',
      value: formatBRL(summary.valorAPagar),
      icon: '/img/finance/pendente.svg',
      tone: 'rose',
    },
    {
      key: 'fixos',
      label: 'Compromissos fixos',
      sub: 'Residencial + carro + rotina',
      value: formatBRL(summary.fixos),
      icon: '/img/finance/mensalidade.svg',
      tone: 'indigo',
    },
    {
      key: 'variaveis',
      label: 'Variáveis',
      sub: 'Cartões e extras',
      value: formatBRL(summary.variaveis),
      icon: '/img/personal/grupo-variaveis.svg',
      tone: 'coral',
      roundIcon: true,
    },
    {
      key: 'pct',
      label: 'Contas pagas',
      sub: `${summary.totalContasChecklist} itens no checklist`,
      value: `${summary.percentualPagas}%`,
      icon: null,
      tone: 'sky',
      ring: summary.percentualPagas,
    },
  ] as const;

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cards.map((card) => (
          <article key={card.key} className={`${styles.card} ${styles[`tone_${card.tone}`]}`}>
            {'ring' in card && card.ring != null ? (
              <div
                className={styles.progressRing}
                style={{ '--pct': `${card.ring}%` } as CSSProperties}
              >
                <span className={styles.progressValue}>{loading ? '…' : card.value}</span>
              </div>
            ) : (
              <div className={styles.cardIconWrap}>
                <img
                  src={card.icon!}
                  alt=""
                  className={'roundIcon' in card && card.roundIcon ? styles.cardIconRound : styles.cardIcon}
                  aria-hidden
                />
              </div>
            )}
            <div className={styles.cardBody}>
              <span className={styles.cardLabel}>{card.label}</span>
              <strong
                className={`${styles.cardValue} ${'negative' in card && card.negative ? styles.negative : ''}`}
              >
                {loading ? '…' : card.value}
              </strong>
              <span className={styles.cardSub}>{card.sub}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
