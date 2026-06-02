/**
 * NEXUS — components.js
 * ---------------------------------------------------------------
 * Carrega navbar.html e footer.html da pasta components/.
 *
 * Estrutura esperada no repositório:
 *  ├── components/
 *  │   ├── navbar.html
 *  │   └── footer.html
 *  ├── components.js      ← este arquivo
 *  ├── home.html
 *  ├── servicos.html
 *  └── ...
 *
 * Como funciona:
 *  1. Lê o atributo data-page do <body> para saber a página atual.
 *  2. Injeta a navbar dentro de #nexus-navbar e o footer em #nexus-footer.
 *  3. Marca o link ativo na navbar com a classe .nav-active.
 *
 * Para adicionar uma nova página:
 *  - Colocar data-page="nome-da-pagina" no <body>
 *  - Ter <div id="nexus-navbar"></div> antes do <main>
 *  - Ter <div id="nexus-footer"></div> depois do </main>
 *  - Importar este script no <head> com defer
 * ---------------------------------------------------------------
 */

(async function () {
  const currentPage = document.body.dataset.page ?? '';

  /**
   * Busca um arquivo HTML dentro de components/ usando caminho
   * absoluto a partir da raiz do site — funciona tanto no
   * GitHub Pages quanto em qualquer servidor local.
   */
  async function loadPartial(filename) {
    // Deriva a raiz do site removendo o path da página atual.
    // Ex: "https://user.github.io/repo/home.html" → "https://user.github.io/repo/"
    const root = window.location.href
      .replace(/\/[^/]*$/, '/')          // remove o arquivo final (home.html etc.)
      .replace(/\/+$/, '/');             // garante exatamente uma barra no fim

    const url = `${root}components/${filename}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
    return res.text();
  }

  /**
   * Injeta HTML em um container e executa qualquer <script> embutido.
   */
  function inject(containerId, html) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = html;
  }

  /**
   * Marca o link correspondente à página atual como ativo.
   */
  function setActiveLink() {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.page === currentPage) {
        // Link ativo: branco + bolinha indicadora
        link.classList.add('nav-active', 'text-white', 'relative',
          "after:content-['']", 'after:absolute', 'after:-bottom-2',
          'after:left-1/2', 'after:-translate-x-1/2',
          'after:w-1', 'after:h-1', 'after:bg-primary', 'after:rounded-full');
        link.classList.remove('text-gray-400');
      } else {
        // Links inativos
        link.classList.add('text-gray-400', 'hover:text-white', 'transition-colors', 'duration-300');
        link.classList.remove('text-white');
      }
    });
  }

  // --- Execução principal ---
  try {
    const [navbarHtml, footerHtml] = await Promise.all([
      loadPartial('navbar.html'),   // → components/navbar.html
      loadPartial('footer.html'),   // → components/footer.html
    ]);

    inject('nexus-navbar', navbarHtml);
    inject('nexus-footer', footerHtml);

    setActiveLink();
  } catch (err) {
    console.error('[NEXUS components.js]', err);
  }
})();
