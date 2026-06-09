export type SiteThemeMode = 'light' | 'dark' | 'auto';

export const SITE_THEME_STORAGE_KEY = 'nexus-site-theme';

export function resolvedSiteTheme(mode: SiteThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredSiteTheme(): SiteThemeMode {
  try {
    const stored = localStorage.getItem(SITE_THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applySiteTheme(mode: SiteThemeMode): SiteThemeMode {
  const safe: SiteThemeMode =
    mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'light';
  const root = document.documentElement;
  root.setAttribute('data-theme-mode', safe);
  root.setAttribute('data-theme', resolvedSiteTheme(safe));
  try {
    localStorage.setItem(SITE_THEME_STORAGE_KEY, safe);
  } catch {
    /* ignore */
  }
  return safe;
}

export function initSiteTheme(): SiteThemeMode {
  return applySiteTheme(getStoredSiteTheme());
}
