const ASSET_SCRIPT_RE = /src="\/assets\/index-([a-zA-Z0-9_-]+)\.js"/;

/** Identificador do build em produção (hash do bundle Vite). */
export function getLoadedBuildId(): string | null {
  if (import.meta.env.DEV) return 'dev';

  const scripts = document.querySelectorAll<HTMLScriptElement>('script[src]');
  for (const script of scripts) {
    const match = script.src.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/);
    if (match) return match[1];
  }
  return null;
}

export function parseBuildIdFromHtml(html: string): string | null {
  const match = html.match(ASSET_SCRIPT_RE);
  if (match) return match[1];
  if (html.includes('/src/main.tsx')) return 'dev';
  return null;
}

export async function fetchRemoteBuildId(): Promise<string | null> {
  const url = `/index.html?_=${Date.now()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  return parseBuildIdFromHtml(html);
}

/** Limpa caches/SW e recarrega ignorando cache do navegador. */
export async function applyHardRefresh(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    /* ignore */
  }

  const url = new URL(window.location.href);
  url.searchParams.set('hub_refresh', String(Date.now()));
  window.location.replace(url.toString());
}

export const APP_UPDATE_POLL_MS = 5 * 60 * 1000;
