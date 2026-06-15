import { NEXUS_SHARE_TEXT, shareNexusWithLogo } from './nexusShare';

const DISMISS_KEY = 'nexus-hub-pwa-install-dismissed';
const INSTALLED_KEY = 'nexus-pwa-installed';
const DISMISS_DAYS = 14;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isInstallBannerDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  const elapsed = Date.now() - dismissedAt;
  return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function dismissInstallBanner(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function clearInstallBannerDismiss(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(DISMISS_KEY);
}

export function isPwaInstalledFlag(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPwaInstalled(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(INSTALLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearPwaInstalled(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(INSTALLED_KEY);
  } catch {
    /* ignore */
  }
}

/** Sincroniza flag local com PWA realmente instalado (detecta desinstalação no Android/Chrome). */
export async function reconcilePwaInstallState(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isStandaloneDisplay()) {
    markPwaInstalled();
    return;
  }

  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<{ id?: string; platform?: string; url?: string }[]>;
  };
  if (typeof nav.getInstalledRelatedApps !== 'function') return;

  try {
    const apps = await nav.getInstalledRelatedApps();
    if (apps?.length) {
      markPwaInstalled();
    } else {
      clearPwaInstalled();
    }
  } catch {
    /* keep existing state */
  }
}

export function hasInstalledApp(): boolean {
  return isStandaloneDisplay() || isPwaInstalledFlag();
}

export function getNexusShareUrl(): string {
  if (typeof window === 'undefined') return 'https://nexussystems.dev/';
  const origin = window.location.origin.replace(/\/$/, '');
  return `${origin}/`;
}

export async function shareNexusApp(): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const url = getNexusShareUrl();

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await shareNexusWithLogo({
        url,
        title: 'NEXUS',
        text: NEXUS_SHARE_TEXT,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      /* fall through */
    }
  }

  return 'failed';
}
