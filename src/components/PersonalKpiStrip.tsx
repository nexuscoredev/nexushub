import { formatBRL } from '../lib/format';
import styles from './PersonalKpiStrip.module.css';

export type PersonalKpiValues = {
  entradas: number;
  saidas: number;
  saldo: number;
};

const KPI_ITEMS: {
  key: keyof PersonalKpiValues;
  label: string;
  icon: string;
}[] = [
  { key: 'entradas', label: 'Receitas', icon: '/img/finance/entradas.svg' },
  { key: 'saidas', label: 'Gastos', icon: '/img/finance/saidas.svg' },
  { key: 'saldo', label: 'Saldo / lucro', icon: '/img/finance/recebido.svg' },
];

interface PersonalKpiStripProps {
  values: PersonalKpiValues;
}

export function PersonalKpiStrip({ values }: PersonalKpiStripProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Resumo pessoal</span>
      <div className={styles.track} role="group" aria-label="Resumo financeiro pessoal">
        {KPI_ITEMS.map(({ key, label, icon }) => (
          <div key={key} className={styles.pill}>
            <span className={styles.logoWrap}>
              <img src={icon} alt="" className={`${styles.logo} brand-logo`} aria-hidden />
            </span>
            <span className={styles.meta}>
              <span className={styles.name}>{label}</span>
              <span
                className={`${styles.value} ${key === 'saldo' && values.saldo < 0 ? styles.negative : ''}`}
              >
                {formatBRL(values[key])}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
