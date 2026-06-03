import { formatBRL } from '../lib/format';
import styles from './FinanceKpiStrip.module.css';

export type FinanceKpiValues = {
  aReceber: number;
  geralEntradas: number;
  recebido: number;
  mensalidade: number;
  saidas: number;
};

const KPI_ITEMS: {
  key: keyof FinanceKpiValues;
  label: string;
  icon: string;
}[] = [
  { key: 'aReceber', label: 'Total a receber', icon: '/img/finance/pendente.svg' },
  { key: 'geralEntradas', label: 'Total geral', icon: '/img/finance/entradas.svg' },
  { key: 'recebido', label: 'Total recebido', icon: '/img/finance/recebido.svg' },
  { key: 'mensalidade', label: 'Total mensalidade / mês', icon: '/img/finance/mensalidade.svg' },
  { key: 'saidas', label: 'Total saídas', icon: '/img/finance/saidas.svg' },
];

interface FinanceKpiStripProps {
  values: FinanceKpiValues;
}

export function FinanceKpiStrip({ values }: FinanceKpiStripProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Resumo</span>
      <div className={styles.track} role="group" aria-label="Resumo financeiro">
        {KPI_ITEMS.map(({ key, label, icon }) => (
          <div key={key} className={styles.pill}>
            <span className={styles.logoWrap}>
              <img
                src={icon}
                alt=""
                className={`${styles.logo} brand-logo`}
                aria-hidden
              />
            </span>
            <span className={styles.meta}>
              <span className={styles.name}>{label}</span>
              <span className={styles.value}>{formatBRL(values[key])}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
