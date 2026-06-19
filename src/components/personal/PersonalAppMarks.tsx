interface MarkProps {
  className?: string;
}

/** Carta de drinks — copo com cítrico e brilho de bar. */
export function DrinksCartaMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={48}
      height={48}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="drinks-glass" x1="18" y1="8" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="drinks-liquid" x1="22" y1="18" x2="30" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="drinks-lime" x1="10" y1="28" x2="18" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id="drinks-glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#drinks-glow)" />
      <ellipse cx="34" cy="34" rx="5.5" ry="3.2" fill="url(#drinks-lime)" transform="rotate(-18 34 34)" />
      <path
        d="M12 34.5c0-1.2.8-2.2 1.9-2.5l1.4-.35c.6-.15 1-.65 1-1.25V18.2c0-.55.45-1 1-1h3.2"
        stroke="#86efac"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M20 17.2h8.5l-2.2 18.2c-.15 1.25-1.15 2.2-2.4 2.2h-1.5c-1.25 0-2.25-.95-2.4-2.2L20 17.2Z"
        fill="url(#drinks-glass)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.75"
      />
      <path
        d="M21.2 24.5h5.1c.55 0 1 .45 1 1v4.8c0 2.2-1.8 4-4 4h-.2c-2.2 0-4-1.8-4-4v-4.8c0-.55.45-1 1-1Z"
        fill="url(#drinks-liquid)"
      />
      <path
        d="M28.5 17.2h3.8l1.6 3.4"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="31" cy="14.5" r="1.1" fill="#fef08a" opacity="0.9" />
      <circle cx="35" cy="18" r="0.75" fill="#fef08a" opacity="0.65" />
      <path
        d="M33.5 12.5l.8 1.6 1.7.25-1.25 1.15.35 1.65-1.55-.85-1.55.85.35-1.65-1.25-1.15 1.7-.25.8-1.6Z"
        fill="#fde047"
        opacity="0.85"
      />
    </svg>
  );
}

/** Adega — garrafa em prateleira de cave. */
export function AdegaMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={48}
      height={48}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="adega-shelf" x1="8" y1="34" x2="40" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78350f" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#92400e" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="adega-glass" x1="22" y1="10" x2="28" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#881337" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="adega-wine" x1="22" y1="18" x2="28" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be123c" />
          <stop offset="55%" stopColor="#881337" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>
        <linearGradient id="adega-label" x1="21" y1="24" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <radialGradient id="adega-glow" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="26" r="20" fill="url(#adega-glow)" />
      <rect x="7" y="33.5" width="34" height="3.2" rx="1.2" fill="url(#adega-shelf)" />
      <rect x="6" y="36.2" width="36" height="1.4" rx="0.7" fill="#451a03" opacity="0.55" />
      <path
        d="M18.5 33.5V31c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2v2.5"
        stroke="#92400e"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M21.5 10.5h5c.8 0 1.5.7 1.5 1.5v1.2c0 .55-.45 1-1 1h-6c-.55 0-1-.45-1-1v-1.2c0-.8.7-1.5 1.5-1.5Z"
        fill="#292524"
      />
      <rect x="22.5" y="8.8" width="3" height="2.2" rx="0.6" fill="#44403c" />
      <path
        d="M20.5 14h7c1.65 0 3 1.35 3 3v15.5c0 1.65-1.35 3-3 3h-7c-1.65 0-3-1.35-3-3V17c0-1.65 1.35-3 3-3Z"
        fill="url(#adega-glass)"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.75"
      />
      <path
        d="M21.2 18.5h5.6c.55 0 1 .45 1 1v13.5c0 .55-.45 1-1 1h-5.6c-.55 0-1-.45-1-1V19.5c0-.55.45-1 1-1Z"
        fill="url(#adega-wine)"
      />
      <rect x="21.4" y="24" width="5.2" height="4.8" rx="0.6" fill="url(#adega-label)" opacity="0.92" />
      <path d="M22.2 26.2h3.6M22.2 27.4h2.4" stroke="#92400e" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
      <ellipse cx="24" cy="18.8" rx="2.8" ry="0.9" fill="rgba(255,255,255,0.12)" />
      <path
        d="M14 33.5h3.2M30.8 33.5h3.2"
        stroke="#78350f"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/** PC Guide — controle + sinal de PC/streaming. */
export function PcGuideMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={48}
      height={48}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="pc-body" x1="10" y1="18" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="pc-accent" x1="14" y1="22" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="pc-screen" x1="28" y1="10" x2="40" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id="pc-glow" cx="45%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="22" cy="26" r="21" fill="url(#pc-glow)" />
      <rect x="27" y="9" width="14" height="10" rx="1.4" fill="url(#pc-screen)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
      <rect x="28.2" y="10.3" width="11.6" height="7" rx="0.8" fill="#0ea5e9" opacity="0.22" />
      <path d="M30 13.5h8M30 15.3h5.5" stroke="#67e8f9" strokeWidth="0.7" strokeLinecap="round" opacity="0.75" />
      <rect x="31" y="19" width="6" height="1.6" rx="0.5" fill="#334155" />
      <path
        d="M8 24.5c0-3.6 2.9-6.5 6.5-6.5h19c3.6 0 6.5 2.9 6.5 6.5v4.2c0 3.6-2.9 6.5-6.5 6.5h-19c-3.6 0-6.5-2.9-6.5-6.5v-4.2Z"
        fill="url(#pc-body)"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="0.75"
      />
      <circle cx="16.5" cy="26.5" r="3.8" fill="url(#pc-accent)" opacity="0.95" />
      <circle cx="16.5" cy="26.5" r="2.1" fill="#0f172a" opacity="0.55" />
      <circle cx="31.5" cy="26.5" r="3.8" fill="url(#pc-accent)" opacity="0.95" />
      <circle cx="31.5" cy="26.5" r="2.1" fill="#0f172a" opacity="0.55" />
      <rect x="18.8" y="24.8" width="10.4" height="3.4" rx="1.7" fill="url(#pc-accent)" opacity="0.85" />
      <circle cx="24" cy="26.5" r="0.85" fill="#e0f2fe" />
      <path
        d="M12.5 31.2c1.2 1.6 3.1 2.6 5.2 2.6h12.6c2.1 0 4-1 5.2-2.6"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36.5 14.5l1.8 1.8M38.3 14.5l-1.8 1.8"
        stroke="#67e8f9"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
