import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalFinanceRows } from '../../hooks/usePersonalFinanceRows';
import type { HubProfile } from '../../types/database';
import { JarvisWidget } from './JarvisWidget';
import styles from './Jarvis.module.css';

interface JarvisLauncherProps {
  profile: HubProfile;
  userId: string | undefined;
}

export function JarvisLauncher({ profile, userId }: JarvisLauncherProps) {
  const [open, setOpen] = useState(false);
  const { rows, refresh } = usePersonalFinanceRows();

  return createPortal(
    <>
      <button
        type="button"
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Abrir JARVIS — assistente pessoal"
        title="JARVIS"
      >
        <span className={styles.fabPulse} aria-hidden />
        <span className={styles.fabCore} aria-hidden />
      </button>
      <JarvisWidget
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        userName={profile.nome}
        rows={rows}
        onRowsChanged={() => void refresh()}
      />
    </>,
    document.body,
  );
}
