import type { VaultProvedorId } from '../../lib/vaultProviders';
import { vaultProviderLogoUrl } from '../../lib/vaultProviderLogos';
import styles from './VaultProviderIcon.module.css';

interface VaultProviderIconProps {
  provider: VaultProvedorId;
  size?: number;
  className?: string;
}

export function VaultProviderIcon({ provider, size = 24, className }: VaultProviderIconProps) {
  const cn = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <img
      className={cn}
      src={vaultProviderLogoUrl(provider)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      aria-hidden
    />
  );
}
