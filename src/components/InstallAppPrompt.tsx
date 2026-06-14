import { useCallback, useState } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import {
  dismissInstallBanner,
  isInstallBannerDismissed,
  isMobileDevice,
} from '../lib/pwaInstall';
import { NavIcon } from './NavIcon';
import { InstallAppModal } from './InstallAppModal';
import styles from './InstallAppPrompt.module.css';

interface InstallAppPromptProps {
  variant?: 'banner' | 'button' | 'icon';
  className?: string;
}

export function InstallAppPrompt({ variant = 'button', className }: InstallAppPromptProps) {
  const { installed, ios, android, canInstallNative, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  const modalMode = installed
    ? 'installed'
    : ios
      ? 'ios'
      : canInstallNative
        ? 'native'
        : android
          ? 'android'
          : 'unavailable';

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (variant === 'banner') dismissInstallBanner();
  }, [variant]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') setOpen(false);
    } finally {
      setInstalling(false);
    }
  }, [promptInstall]);

  if (variant === 'banner') {
    if (installed || isInstallBannerDismissed() || !isMobileDevice()) return null;
  }

  if (variant === 'icon' && installed) return null;

  return (
    <>
      {variant === 'banner' ? (
        <div className={`${styles.banner} ${className ?? ''}`}>
          <div className={styles.bannerCopy}>
            <img src="/img/favicon.png" alt="" className={styles.bannerIcon} width={36} height={36} />
            <div>
              <p className={styles.bannerTitle}>Baixar o app</p>
              <p className={styles.bannerSub}>NEXUS Hub na sua tela inicial</p>
            </div>
          </div>
          <div className={styles.bannerActions}>
            <button type="button" className={styles.bannerPrimary} onClick={handleOpen}>
              Baixar
            </button>
            <button type="button" className={styles.bannerGhost} onClick={handleClose} aria-label="Dispensar">
              ×
            </button>
          </div>
        </div>
      ) : variant === 'icon' ? (
        <button
          type="button"
          className={`${styles.iconBtn} ${className ?? ''}`}
          onClick={handleOpen}
          aria-label="Baixar app"
          title="Baixar app"
        >
          <NavIcon name="install" className={styles.iconBtnGlyph} />
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.button} ${className ?? ''}`}
          onClick={handleOpen}
        >
          <img src="/img/favicon.png" alt="" className={styles.buttonIcon} width={20} height={20} />
          <span>{installed ? 'App instalado' : 'Baixar app'}</span>
        </button>
      )}

      <InstallAppModal
        open={open}
        mode={modalMode}
        onClose={handleClose}
        onInstall={handleInstall}
        installing={installing}
      />
    </>
  );
}
