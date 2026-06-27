import { useEffect, useState } from 'react';

/** `true` when viewport width is at most `maxPx` (inclusive). */
export function useMaxWidth(maxPx: number): boolean {
  const query = `(max-width: ${maxPx}px)`;

  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
