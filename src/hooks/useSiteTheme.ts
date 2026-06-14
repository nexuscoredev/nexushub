import { useCallback, useEffect, useState } from 'react';
import {
  applySiteTheme,
  getStoredSiteTheme,
  initSiteTheme,
  type SiteThemeMode,
} from '../lib/siteTheme';

export function useSiteTheme() {
  const [mode, setMode] = useState<SiteThemeMode>(() => {
    if (typeof document === 'undefined') return 'auto';
    return (
      (document.documentElement.getAttribute('data-theme-mode') as SiteThemeMode | null) ??
      getStoredSiteTheme()
    );
  });

  useEffect(() => {
    setMode(initSiteTheme());
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (document.documentElement.getAttribute('data-theme-mode') === 'auto') {
        setMode(applySiteTheme('auto'));
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: SiteThemeMode) => {
    setMode(applySiteTheme(next));
  }, []);

  return { mode, setTheme };
}
