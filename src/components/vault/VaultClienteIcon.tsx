import { clienteInitials, clienteLogoUrl } from '../../lib/vaultClientes';
import type { VaultClienteRef } from '../../lib/vaultClientes';
import styles from './VaultClienteIcon.module.css';

interface VaultClienteIconProps {
  cliente: VaultClienteRef;
  size?: number;
  className?: string;
}

export function VaultClienteIcon({ cliente, size = 26, className }: VaultClienteIconProps) {
  const logoUrl = clienteLogoUrl(cliente);
  const cn = [styles.root, className].filter(Boolean).join(' ');
  const dim = { width: size, height: size };

  if (logoUrl) {
    return (
      <span className={cn} style={dim} aria-hidden>
        <img className={styles.img} src={logoUrl} alt="" width={size} height={size} />
      </span>
    );
  }

  return (
    <span className={cn} style={dim} aria-hidden>
      <span className={styles.initials} style={{ fontSize: Math.max(9, size * 0.38) }}>
        {clienteInitials(cliente.nome)}
      </span>
    </span>
  );
}
