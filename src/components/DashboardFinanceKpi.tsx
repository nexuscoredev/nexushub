import { Link } from 'react-router-dom';
import { formatBRL } from '../lib/format';
import styles from './DashboardFinanceKpi.module.css';

interface DashboardFinanceKpiProps {
  lucroMensal: number;
  implantacaoAReceber: number;
  mensalidadesMes: number;
  loading?: boolean;
}

export function DashboardFinanceKpi({
  lucroMensal,
  implantacaoAReceber,
  mensalidadesMes,
  loading,
}: DashboardFinanceKpiProps) {
  return (
    <div className={`kpi ${styles.card}`}>
      <div className={styles.head}>
        <span className={styles.headLabel}>Financeiro</span>
        <Link to="/financeiro" className={styles.headLink}>
          Ver detalhes
        </Link>
      </div>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>Lucro mensal (est.)</dt>
          <dd className={styles.valueMain}>
            {loading ? '…' : formatBRL(lucroMensal)}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Implantações a receber</dt>
          <dd>{loading ? '…' : formatBRL(implantacaoAReceber)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Mensalidades / mês</dt>
          <dd>{loading ? '…' : formatBRL(mensalidadesMes)}</dd>
        </div>
      </dl>
    </div>
  );
}
