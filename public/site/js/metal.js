/**
 * NEXUS — reflexo metálico reativo (site estático)
 */
(function () {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let px = 50;
  let py = 35;

  function applyPointer() {
    root.style.setProperty('--nx-px', px + '%');
    root.style.setProperty('--nx-py', py + '%');
    raf = 0;
  }

  function onPointerMove(e) {
    px = (e.clientX / window.innerWidth) * 100;
    py = (e.clientY / window.innerHeight) * 100;
    if (!raf) raf = requestAnimationFrame(applyPointer);
  }

  function bindTilt(el) {
    const set = (x, y) => {
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    };

    el.addEventListener(
      'pointermove',
      (e) => {
        const rect = el.getBoundingClientRect();
        set(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
      },
      { passive: true }
    );

    el.addEventListener('pointerleave', () => set(50, 50));
    set(50, 50);
  }

  function init() {
    root.style.setProperty('--nx-px', '50%');
    root.style.setProperty('--nx-py', '35%');

    if (!reduced) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    document.querySelectorAll('.nx-metal-tilt').forEach(bindTilt);
  }

  window.NexusMetal = { init };
})();
