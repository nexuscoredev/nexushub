interface TodoistIconProps {
  className?: string;
}

/** Marca Todoist simplificada (vermelho + listas) */
export function TodoistIcon({ className }: TodoistIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect width="24" height="24" rx="5.5" fill="#E44332" />
      <path
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        d="M7 8.5h10M7 12h7.5M7 15.5h5"
      />
    </svg>
  );
}
