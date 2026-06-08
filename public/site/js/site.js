(function () {
  function initMobileNav() {
    const toggle = document.getElementById('nx-nav-toggle');
    const panel = document.getElementById('nx-nav-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.NexusTheme?.initButtons?.();
    window.NexusMetal?.init?.();
    initMobileNav();
  });
})();
