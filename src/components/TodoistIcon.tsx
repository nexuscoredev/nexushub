interface TodoistIconProps {
  className?: string;
}

/** Marca Todoist (vermelho + check) */
export function TodoistIcon({ className }: TodoistIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect width="24" height="24" rx="5" fill="#E44332" />
      <path
        d="M7 12.5 10 15.5 17 8.5"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
