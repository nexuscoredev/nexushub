const BODY_LOCK_CLASS = 'demo-fullscreen-lock';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function isDemoFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
}

export async function requestDemoFullscreen(target?: HTMLElement | null): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (isDemoFullscreen()) return true;

  const el = (target ?? document.documentElement) as FullscreenElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return isDemoFullscreen();
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return isDemoFullscreen();
    }
  } catch {
    return false;
  }

  return false;
}

export async function exitDemoFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!isDemoFullscreen()) return;

  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    /* ignore */
  }
}

export function lockDemoViewport(lock: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(BODY_LOCK_CLASS, lock);
}
