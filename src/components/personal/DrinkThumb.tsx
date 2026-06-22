import { useEffect, useState } from 'react';
import { DRINK_FALLBACK_THUMB } from '../../lib/viniciusDrinksCarta';
import styles from './DrinkThumb.module.css';

interface DrinkThumbProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
}

type ThumbPhase = 'primary' | 'fallback' | 'emoji';

export function DrinkThumb({
  src,
  alt = '',
  className,
  fallbackClassName,
  loading = 'lazy',
}: DrinkThumbProps) {
  const [phase, setPhase] = useState<ThumbPhase>('primary');

  useEffect(() => {
    setPhase('primary');
  }, [src]);

  if (phase === 'emoji' || !src) {
    return (
      <span
        className={[styles.fallback, fallbackClassName ?? className].filter(Boolean).join(' ')}
        aria-hidden={alt === ''}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      >
        🍸
      </span>
    );
  }

  const resolvedSrc = phase === 'fallback' ? DRINK_FALLBACK_THUMB : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => {
        setPhase((current) => {
          if (current === 'primary' && resolvedSrc !== DRINK_FALLBACK_THUMB) return 'fallback';
          return 'emoji';
        });
      }}
    />
  );
}
