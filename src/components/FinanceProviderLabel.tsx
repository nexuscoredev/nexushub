import { matchFinanceProviderBrand } from '../lib/financeProviderLabels';
import styles from './FinanceProviderLabel.module.css';

interface FinanceProviderLabelProps {
  titulo: string;
}

/** Descrição de saída com wordmark quando for Cursor, Supabase ou Vercel. */
export function FinanceProviderLabel({ titulo }: FinanceProviderLabelProps) {
  const brand = matchFinanceProviderBrand(titulo);
  if (!brand) return <>{titulo}</>;

  return (
    <span className={styles.pill}>
      <img
        src={brand.src}
        alt={brand.alt}
        className={styles.brandLabel}
        style={{ transform: `scale(${brand.visualScale})` }}
      />
    </span>
  );
}
