interface TheNewsMarkProps {
  className?: string;
}

export function TheNewsMark({ className }: TheNewsMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width={28}
      height={28}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="the-news-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="1" y="10" width="3.5" height="8" rx="0.75" fill="#f97316" />
      <circle cx="16" cy="14" r="9.5" fill="url(#the-news-grad)" />
    </svg>
  );
}
