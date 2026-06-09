(function () {
  function setNavOpen(open) {
    const drawer = document.getElementById('nx-nav-drawer');
    const panel = document.getElementById('nx-nav-panel');
    const toggle = document.getElementById('nx-nav-toggle');
    if (!drawer || !panel || !toggle) return;

    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('nx-nav-open', open);
  }

  function initMobileNav() {
    const toggle = document.getElementById('nx-nav-toggle');
    const drawer = document.getElementById('nx-nav-drawer');
    const panel = document.getElementById('nx-nav-panel');
    const backdrop = document.getElementById('nx-nav-backdrop');
    const closeBtn = document.getElementById('nx-nav-close');
    if (!toggle || !drawer || !panel) return;

    const openNav = () => setNavOpen(true);
    const closeNav = () => setNavOpen(false);

    toggle.addEventListener('click', () => {
      setNavOpen(!drawer.classList.contains('is-open'));
    });

    backdrop?.addEventListener('click', closeNav);
    closeBtn?.addEventListener('click', closeNav);

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.NexusTheme?.initButtons?.();
    initMobileNav();
  });
})();
