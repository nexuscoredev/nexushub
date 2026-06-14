(function () {
  const DISMISS_KEY = 'nexus-hub-pwa-install-dismissed';
  const INSTALLED_KEY = 'nexus-pwa-installed';
  const DISMISS_DAYS = 14;

  let deferredPrompt = null;

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    );
  }

  function markInstalled() {
    try {
      localStorage.setItem(INSTALLED_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  function hasInstalledApp() {
    if (isStandalone()) return true;
    try {
      return localStorage.getItem(INSTALLED_KEY) === '1';
    } catch {
      return false;
    }
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function isBannerDismissed() {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      const elapsed = Date.now() - Number(raw);
      return Number.isFinite(elapsed) && elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  function dismissBanner() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function getShareUrl() {
    return window.location.origin.replace(/\/$/, '') + '/';
  }

  function ensureHeadTags() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest';
      document.head.appendChild(link);
    }
  }

  function registerSw() {
    if (!('serviceWorker' in navigator)) return;
    if (/localhost|127\.0\.0\.1/.test(location.hostname)) return;
    void navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  function getModalMode() {
    if (hasInstalledApp()) return 'share';
    if (isIos()) return 'ios';
    if (deferredPrompt) return 'native';
    if (isAndroid()) return 'android';
    return 'unavailable';
  }

  async function shareApp() {
    const url = getShareUrl();
    const shareData = {
      title: 'NEXUS',
      text: 'Conheça a NEXUS — tecnologia personalizada que se adapta ao seu negócio.',
      url: url,
    };

    if (navigator.share) {
      try {
        var logoFile = null;
        try {
          var imgRes = await fetch('/img/nexus-share.png');
          if (imgRes.ok) {
            var blob = await imgRes.blob();
            logoFile = new File([blob], 'nexus-share.png', { type: 'image/png' });
          }
        } catch (fetchErr) {
          /* preview sem imagem */
        }
        if (logoFile && navigator.canShare && navigator.canShare(Object.assign({}, shareData, { files: [logoFile] }))) {
          await navigator.share(Object.assign({}, shareData, { files: [logoFile] }));
        } else {
          await navigator.share(shareData);
        }
        return 'shared';
      } catch (err) {
        if (err && err.name === 'AbortError') return 'cancelled';
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return 'copied';
      } catch {
        /* ignore */
      }
    }

    return 'failed';
  }

  function stepsHtml(mode, shareFeedback) {
    if (mode === 'share') {
      return (
        '<p class="nx-install-modal__hint">O NEXUS já está na sua tela inicial. Envie o link para outras pessoas instalarem também.</p>' +
        (shareFeedback ? '<p class="nx-install-modal__ok">' + shareFeedback + '</p>' : '')
      );
    }
    if (mode === 'ios') {
      return (
        '<ol class="nx-install-modal__steps">' +
        '<li><span class="nx-install-modal__num">1</span><span>Toque em <strong>Compartilhar</strong> no Safari</span></li>' +
        '<li><span class="nx-install-modal__num">2</span><span>Escolha <strong>Adicionar à Tela de Início</strong></span></li>' +
        '<li><span class="nx-install-modal__num">3</span><span>Confirme em <strong>Adicionar</strong></span></li>' +
        '</ol>'
      );
    }
    if (mode === 'android') {
      return (
        '<ol class="nx-install-modal__steps">' +
        '<li><span class="nx-install-modal__num">1</span><span>Toque nos <strong>três pontos</strong> (⋮) no Chrome</span></li>' +
        '<li><span class="nx-install-modal__num">2</span><span>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong></span></li>' +
        '<li><span class="nx-install-modal__num">3</span><span>Confirme em <strong>Instalar</strong></span></li>' +
        '</ol>'
      );
    }
    if (mode === 'native') {
      return '<p class="nx-install-modal__hint">Toque em instalar — o app vai para sua tela inicial em segundos.</p>';
    }
    return '<p class="nx-install-modal__hint">Abra no Chrome (Android) ou Safari (iPhone) para instalar o site NEXUS.</p>';
  }

  function openModal() {
    const existing = document.getElementById('nx-install-modal');
    if (existing) existing.remove();

    renderModal();
  }

  function renderModal(shareFeedback) {
    const existing = document.getElementById('nx-install-modal');
    if (existing) existing.remove();

    const mode = getModalMode();
    const overlay = document.createElement('div');
    overlay.className = 'nx-install-modal';
    overlay.id = 'nx-install-modal';
    overlay.innerHTML =
      '<div class="nx-install-modal__backdrop" data-install-close aria-hidden="true"></div>' +
      '<div class="nx-install-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="nx-install-title">' +
      '<div class="nx-install-modal__head">' +
      '<div><h2 id="nx-install-title" class="nx-install-modal__title">' +
      (mode === 'share' ? 'Compartilhar o app' : 'Baixar o app') +
      '</h2>' +
      '<p class="nx-install-modal__sub">' +
      (mode === 'share'
        ? 'Indique a NEXUS para colegas e clientes.'
        : 'Instale o site NEXUS — acesso rápido como app nativo.') +
      '</p></div>' +
      '<button type="button" class="nx-install-modal__close" data-install-close aria-label="Fechar">' +
      '<span class="material-symbols-outlined" aria-hidden="true">close</span></button></div>' +
      '<div class="nx-install-modal__preview">' +
      '<img src="/img/favicon.png" alt="" width="48" height="48" />' +
      '<div><p class="nx-install-modal__app">NEXUS</p><p class="nx-install-modal__meta">Site · tecnologia sob medida</p></div></div>' +
      stepsHtml(mode, shareFeedback) +
      '<div class="nx-install-modal__actions">' +
      (mode === 'native'
        ? '<button type="button" class="nx-btn nx-btn--primary" id="nx-install-confirm">Instalar app</button>'
        : mode === 'share'
          ? '<button type="button" class="nx-btn nx-btn--primary" id="nx-install-share">Compartilhar</button>'
          : mode === 'ios' || mode === 'android'
            ? '<button type="button" class="nx-btn nx-btn--primary" data-install-close>Entendi</button>'
            : '') +
      (mode !== 'share'
        ? '<button type="button" class="nx-btn nx-btn--ghost" data-install-close>Agora não</button>'
        : '<button type="button" class="nx-btn nx-btn--ghost" data-install-close>Fechar</button>') +
      '</div></div>';

    document.body.appendChild(overlay);
    document.body.classList.add('nx-install-open');

    overlay.querySelectorAll('[data-install-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    const confirm = document.getElementById('nx-install-confirm');
    if (confirm) {
      confirm.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          if (choice.outcome === 'accepted') {
            deferredPrompt = null;
            markInstalled();
          }
          closeModal();
        });
      });
    }

    const shareBtn = document.getElementById('nx-install-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        shareBtn.disabled = true;
        shareBtn.textContent = 'Compartilhando…';
        shareApp().then(function (outcome) {
          if (outcome === 'shared') {
            closeModal();
            return;
          }
          shareBtn.disabled = false;
          shareBtn.textContent = 'Compartilhar';
          if (outcome === 'copied') {
            renderModal('Link copiado para a área de transferência.');
            return;
          }
          if (outcome === 'cancelled') return;
          renderModal('Não foi possível compartilhar. Copie o link manualmente.');
        });
      });
    }

    document.addEventListener('keydown', onEscape);
  }

  function onEscape(event) {
    if (event.key === 'Escape') closeModal();
  }

  function closeModal() {
    const overlay = document.getElementById('nx-install-modal');
    if (overlay) overlay.remove();
    document.body.classList.remove('nx-install-open');
    document.removeEventListener('keydown', onEscape);
  }

  function injectBanner() {
    if (hasInstalledApp() || !isMobile() || isBannerDismissed()) return;
    const main = document.querySelector('main');
    if (!main || main.querySelector('.nx-install-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'nx-install-banner';
    banner.innerHTML =
      '<div class="nx-install-banner__copy">' +
      '<img src="/img/favicon.png" alt="" width="36" height="36" />' +
      '<div><p class="nx-install-banner__title">Baixar o app</p>' +
      '<p class="nx-install-banner__sub">Site NEXUS na sua tela inicial</p></div></div>' +
      '<div class="nx-install-banner__actions">' +
      '<button type="button" class="nx-btn nx-btn--primary nx-install-banner__btn">Baixar</button>' +
      '<button type="button" class="nx-install-banner__dismiss" aria-label="Dispensar">×</button></div>';

    main.insertBefore(banner, main.firstChild);

    banner.querySelector('.nx-install-banner__btn')?.addEventListener('click', openModal);
    banner.querySelector('.nx-install-banner__dismiss')?.addEventListener('click', function () {
      dismissBanner();
      banner.remove();
    });
  }

  function bindTriggers() {
    document.querySelectorAll('[data-install-trigger]').forEach(function (btn) {
      if (btn.dataset.installBound === '1') return;
      btn.dataset.installBound = '1';
      btn.addEventListener('click', openModal);
    });
  }

  function updateInstallButtons() {
    const installed = hasInstalledApp();
    document.querySelectorAll('[data-install-trigger]').forEach(function (btn) {
      btn.hidden = false;
      const label = installed ? 'Compartilhar app' : 'Baixar app';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);

      btn.querySelectorAll('.nx-install-trigger-icon').forEach(function (icon) {
        icon.textContent = installed ? 'share' : 'install_mobile';
      });

      btn.querySelectorAll('.nx-install-trigger-label').forEach(function (el) {
        el.textContent = label;
      });
    });
  }

  function init() {
    ensureHeadTags();
    registerSw();
    injectBanner();
    bindTriggers();
    updateInstallButtons();

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
    });

    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      markInstalled();
      document.querySelector('.nx-install-banner')?.remove();
      updateInstallButtons();
    });
  }

  window.NexusInstall = { init: init, open: openModal, share: shareApp };

  document.addEventListener('DOMContentLoaded', init);
})();
