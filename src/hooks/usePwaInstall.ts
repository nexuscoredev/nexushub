import { useCallback, useEffect, useState } from 'react';
import type { BeforeInstallPromptEvent } from '../lib/pwaInstall';
import {
  clearPwaInstalled,
  hasInstalledApp,
  isAndroidDevice,
  isIosDevice,
  markPwaInstalled,
  reconcilePwaInstallState,
  shareNexusApp,
} from '../lib/pwaInstall';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(hasInstalledApp);
  const ios = isIosDevice();
  const android = isAndroidDevice();

  useEffect(() => {
    const syncInstalled = () => setInstalled(hasInstalledApp());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      clearPwaInstalled();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      syncInstalled();
    };

    const onInstalled = () => {
      markPwaInstalled();
      setInstalled(true);
      setDeferredPrompt(null);
    };

    void reconcilePwaInstallState().then(syncInstalled);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => {
      void reconcilePwaInstallState().then(syncInstalled);
    };
    standaloneMq.addEventListener('change', onDisplayChange);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void reconcilePwaInstallState().then(syncInstalled);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      standaloneMq.removeEventListener('change', onDisplayChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    if (installed) return 'unavailable';
    if (ios) return 'ios';
    if (!deferredPrompt) return 'unavailable';

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setInstalled(true);
    return outcome;
  }, [deferredPrompt, installed, ios]);

  return {
    installed,
    ios,
    android,
    canInstallNative: deferredPrompt != null,
    promptInstall,
    shareApp: shareNexusApp,
  };
}
