import { useEffect, type RefObject } from 'react';

export function useMetalPointer(ref?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = ref?.current ?? document.documentElement;
    let raf = 0;
    let px = 50;
    let py = 35;

    const apply = () => {
      target.style.setProperty('--metal-px', `${px}%`);
      target.style.setProperty('--metal-py', `${py}%`);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 100;
      py = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    target.style.setProperty('--metal-px', '50%');
    target.style.setProperty('--metal-py', '35%');

    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
