(function () {
  const STORAGE_KEY = 'nexus-site-theme';
  const root = document.documentElement;

  function resolvedTheme(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncThemeButtons(mode) {
    const safe = mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'auto';
    document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
      const active = btn.getAttribute('data-theme-btn') === safe;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyTheme(mode) {
    const safe = mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'auto';
    root.setAttribute('data-theme-mode', safe);
    root.setAttribute('data-theme', resolvedTheme(safe));
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      /* ignore */
    }
    syncThemeButtons(safe);
  }

  function initThemeButtons() {
    document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
      if (btn.dataset.themeBound === 'true') return;
      btn.dataset.themeBound = 'true';
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-btn')));
    });
    syncThemeButtons(root.getAttribute('data-theme-mode') || stored);
  }

  let stored = 'auto';
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    stored =
      fromStorage === 'dark' || fromStorage === 'light' || fromStorage === 'auto'
        ? fromStorage
        : 'auto';
  } catch {
    stored = 'auto';
  }
  applyTheme(stored);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (root.getAttribute('data-theme-mode') === 'auto') applyTheme('auto');
  });

  window.NexusTheme = { apply: applyTheme, initButtons: initThemeButtons, syncButtons: syncThemeButtons };
})();
