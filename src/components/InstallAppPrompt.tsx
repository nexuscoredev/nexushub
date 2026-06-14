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
  const { installed, ios, android, canInstallNative, promptInstall, shareApp } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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
    setShareFeedback(null);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setShareFeedback(null);
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

  const handleShare = useCallback(async () => {
    setSharing(true);
    setShareFeedback(null);
    try {
      const outcome = await shareApp();
      if (outcome === 'shared') {
        setOpen(false);
        return;
      }
      if (outcome === 'copied') {
        setShareFeedback('Link copiado para a área de transferência.');
        return;
      }
      if (outcome === 'cancelled') return;
      setShareFeedback('Não foi possível compartilhar. Copie o link manualmente: nexussystems.dev');
    } finally {
      setSharing(false);
    }
  }, [shareApp]);

  if (variant === 'banner') {
    if (installed || isInstallBannerDismissed() || !isMobileDevice()) return null;
  }

  const iconLabel = installed ? 'Compartilhar app' : 'Baixar app';
  const buttonLabel = installed ? 'Compartilhar app' : 'Baixar app';

  return (
    <>
      {variant === 'banner' ? (
        <div className={`${styles.banner} ${className ?? ''}`}>
          <div className={styles.bannerCopy}>
            <img src="/img/favicon.png" alt="" className={styles.bannerIcon} width={36} height={36} />
            <div>
              <p className={styles.bannerTitle}>Baixar o app</p>
              <p className={styles.bannerSub}>Site NEXUS na sua tela inicial</p>
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
          aria-label={iconLabel}
          title={iconLabel}
        >
          <NavIcon name={installed ? 'share' : 'install'} className={styles.iconBtnGlyph} />
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.button} ${className ?? ''}`}
          onClick={handleOpen}
        >
          <img src="/img/favicon.png" alt="" className={styles.buttonIcon} width={20} height={20} />
          <span>{buttonLabel}</span>
        </button>
      )}

      <InstallAppModal
        open={open}
        mode={modalMode}
        onClose={handleClose}
        onInstall={handleInstall}
        onShare={installed ? handleShare : undefined}
        shareFeedback={shareFeedback}
        installing={installing}
        sharing={sharing}
      />
    </>
  );
}
