interface NovidadesSparkIconProps {
  className?: string;
}

/** Brilhos no estilo Nexus (prata via currentColor + glow no CSS). */
export function NovidadesSparkIcon({ className = '' }: NovidadesSparkIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2 L13.09 8.26 L20 9 L13.09 9.74 L12 16 L10.91 9.74 L4 9 L10.91 8.26 Z" />
      <path d="M18 14 L18.65 16.35 L21 17 L18.65 17.65 L18 20 L17.35 17.65 L15 17 L17.35 16.35 Z" />
    </svg>
  );
}
