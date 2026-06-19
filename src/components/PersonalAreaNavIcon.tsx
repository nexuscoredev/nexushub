interface PersonalAreaNavIconProps {
  className?: string;
}

/** Estrela ✦ da área pessoal — índigo com glow no CSS. */
export function PersonalAreaNavIcon({ className = '' }: PersonalAreaNavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5 13.65 9.2 20.5 10.85 13.65 12.5 12 19.15 10.35 12.5 3.5 10.85 10.35 9.2 12 2.5Z" />
    </svg>
  );
}
