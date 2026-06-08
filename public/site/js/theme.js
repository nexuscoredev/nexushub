(function () {
  const STORAGE_KEY = 'nexus-site-theme';
  const root = document.documentElement;

  function resolvedTheme(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(mode) {
    const safe = mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'light';
    root.setAttribute('data-theme-mode', safe);
    root.setAttribute('data-theme', resolvedTheme(safe));
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      /* ignore */
    }
    document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
      const active = btn.getAttribute('data-theme-btn') === safe;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function initThemeButtons() {
    document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-btn')));
    });
  }

  let stored = 'light';
  try {
    stored = localStorage.getItem(STORAGE_KEY) || 'light';
  } catch {
    stored = 'light';
  }
  applyTheme(stored);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (root.getAttribute('data-theme-mode') === 'auto') applyTheme('auto');
  });

  window.NexusTheme = { apply: applyTheme, initButtons: initThemeButtons };
})();
