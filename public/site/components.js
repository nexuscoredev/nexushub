/**
 * NEXUS — components.js
 * Carrega navbar/footer e marca link ativo.
 */
(async function () {
  const currentPage = document.body.dataset.page ?? '';

  async function loadPartial(filename) {
    const root = window.location.href.replace(/\/[^/]*$/, '/').replace(/\/+$/, '/');
    const url = `${root}components/${filename}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
    return res.text();
  }

  function inject(containerId, html) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = html;
  }

  function setActiveLink() {
    document.querySelectorAll('.nav-link').forEach((link) => {
      const active = link.dataset.page === currentPage;
      link.classList.toggle('is-active', active);
      if (link.classList.contains('nx-nav__link')) return;
      link.classList.toggle('nav-active', active);
    });
  }

  try {
    const [navbarHtml, footerHtml] = await Promise.all([
      loadPartial('navbar.html'),
      loadPartial('footer.html'),
    ]);

    inject('nexus-navbar', navbarHtml);
    inject('nexus-footer', footerHtml);

    setActiveLink();
    window.NexusTheme?.initButtons?.();
  } catch (err) {
    console.error('[NEXUS components.js]', err);
  }
})();
