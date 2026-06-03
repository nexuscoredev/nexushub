import { useId } from 'react';

interface NovidadesSparkIconProps {
  className?: string;
}

/** Brilhos no estilo Nexus (prata / liquid silver). */
export function NovidadesSparkIcon({ className = '' }: NovidadesSparkIconProps) {
  const gradId = useId().replace(/:/g, '');

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="2" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#6e6e6e" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M9.5 2 10 7.5 4 9.5 7.5 10 2 9.5 7.5 4 9.5 10 7.5 9.5 2Z"
      />
      <path
        fill={`url(#${gradId})`}
        d="M18 14.5 18.3 17 16 17.3 16.5 19.5 14 18 14.5 17 16 16.5 19.5 14 17.3 14.5 18Z"
      />
    </svg>
  );
}
