import { useCallback, useEffect, useState } from 'react';
import type { BeforeInstallPromptEvent } from '../lib/pwaInstall';
import {
  hasInstalledApp,
  isAndroidDevice,
  isIosDevice,
  markPwaInstalled,
  shareNexusApp,
} from '../lib/pwaInstall';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(hasInstalledApp);
  const ios = isIosDevice();
  const android = isAndroidDevice();

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      markPwaInstalled();
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => setInstalled(hasInstalledApp());
    standaloneMq.addEventListener('change', onDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      standaloneMq.removeEventListener('change', onDisplayChange);
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
