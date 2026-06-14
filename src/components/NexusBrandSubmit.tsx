import { NexusBrandWordmark } from './NexusBrandWordmark';
import logoStyles from './HubLogo.module.css';
import styles from './NexusBrandSubmit.module.css';

type NexusProduct = 'hub' | 'client';

interface NexusBrandSubmitProps {
  product: NexusProduct;
  loading?: boolean;
  disabled?: boolean;
}

const LABELS: Record<NexusProduct, { accent: string; aria: string }> = {
  hub: { accent: 'Hub', aria: 'Entrar no NexusHub' },
  client: { accent: 'Client', aria: 'Entrar no NexusClient' },
};

export function NexusBrandSubmit({ product, loading = false, disabled = false }: NexusBrandSubmitProps) {
  const { accent, aria } = LABELS[product];

  return (
    <button
      type="submit"
      className={styles.button}
      disabled={disabled || loading}
      aria-label={loading ? 'Autenticando' : aria}
    >
      {loading ? (
        <span className={styles.loading}>Autenticando…</span>
      ) : (
        <span className={`${logoStyles.mark} ${logoStyles.compactBrand}`}>
          <NexusBrandWordmark
            subtitleText={accent}
            accent={product}
            withIcon
            markImgClassName={logoStyles.markImg}
          />
        </span>
      )}
    </button>
  );
}
