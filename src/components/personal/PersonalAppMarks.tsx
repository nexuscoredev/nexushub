interface MarkProps {
  className?: string;
}

/** Carta de drinks — lounge premium, copo e cítricos. */
export function DrinksCartaMark({ className }: MarkProps) {
  const id = 'drinks-prem';
  return (
    <svg className={className} viewBox="0 0 64 64" width={64} height={64} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="8" y1="4" x2="56" y2="60">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="45%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#0f0518" />
        </linearGradient>
        <radialGradient id={`${id}-bokeh-a`} cx="78%" cy="22%" r="28%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-bokeh-b`} cx="18%" cy="72%" r="32%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x1="26" y1="16" x2="40" y2="52">
          <stop offset="0%" stopColor="#faf5ff" stopOpacity="0.92" />
          <stop offset="40%" stopColor="#c4b5fd" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`${id}-liquid`} x1="28" y1="28" x2="36" y2="48">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}-lime`} x1="14" y1="38" x2="22" y2="48">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="55%" r="58%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="32" y1="4" x2="32" y2="26">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <circle cx="50" cy="14" r="14" fill={`url(#${id}-bokeh-a)`} />
      <circle cx="12" cy="46" r="16" fill={`url(#${id}-bokeh-b)`} />
      <ellipse cx="48" cy="46" rx="7" ry="4" fill={`url(#${id}-lime)`} transform="rotate(-22 48 46)" />
      <path
        d="M16 47c0-1.4 1-2.6 2.3-2.9l1.6-.4c.7-.18 1.2-.75 1.2-1.45V24.5c0-.6.5-1.1 1.1-1.1h3.6"
        stroke="#86efac"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M26 22.5h11l-2.8 23.5c-.2 1.55-1.45 2.75-3.05 2.75h-1.9c-1.6 0-2.85-1.2-3.05-2.75L26 22.5Z"
        fill={`url(#${id}-glass)`}
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="0.85"
      />
      <path d="M27.5 24h9" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinecap="round" />
      <path
        d="M27.8 32.5h8.4c.6 0 1.1.5 1.1 1.1v6.2c0 2.6-2.1 4.7-4.7 4.7h-.2c-2.6 0-4.7-2.1-4.7-4.7v-6.2c0-.6.5-1.1 1.1-1.1Z"
        fill={`url(#${id}-liquid)`}
      />
      <ellipse cx="31.5" cy="31" rx="3.2" ry="1.1" fill="rgba(255,255,255,0.35)" />
      <path
        d="M37 22.5h4.5l1.9 4.2"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="40" cy="18.5" r="1.3" fill="#fef08a" />
      <circle cx="44.5" cy="22.5" r="0.9" fill="#fde047" opacity="0.75" />
      <path
        d="M43 16.5l.9 1.8 2 .3-1.45 1.35.4 1.85-1.8-.95-1.8.95.4-1.85-1.45-1.35 2-.3.9-1.8Z"
        fill="#fde047"
      />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.15" />
      <rect x="0" y="0" width="64" height="64" rx="15" fill={`url(#${id}-vignette)`} />
      <path d="M10 16 Q32 4 54 16 L54 24 Q32 14 10 24 Z" fill={`url(#${id}-shine)`} />
    </svg>
  );
}

/** Adega — cave premium, garrafa com selo de cera. */
export function AdegaMark({ className }: MarkProps) {
  const id = 'adega-prem';
  return (
    <svg className={className} viewBox="0 0 64 64" width={64} height={64} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="10" y1="6" x2="54" y2="58">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="50%" stopColor="#1c0509" />
          <stop offset="100%" stopColor="#0a0306" />
        </linearGradient>
        <radialGradient id={`${id}-spot`} cx="50%" cy="18%" r="42%">
          <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fecdd3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shelf`} x1="6" y1="44" x2="58" y2="44">
          <stop offset="0%" stopColor="#451a03" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="28" y1="12" x2="36" y2="44">
          <stop offset="0%" stopColor="#fff1f2" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#881337" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${id}-wine`} x1="28" y1="22" x2="36" y2="42">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="40%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="27" y1="30" x2="37" y2="36">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id={`${id}-wax`} x1="29" y1="8" x2="35" y2="14">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0.32" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="55%" r="58%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="32" y1="4" x2="32" y2="26">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <ellipse cx="32" cy="12" rx="22" ry="14" fill={`url(#${id}-spot)`} />
      <rect x="8" y="44" width="48" height="4" rx="1.4" fill={`url(#${id}-shelf)`} />
      <rect x="7" y="47.5" width="50" height="1.8" rx="0.8" fill="#292524" opacity="0.65" />
      <path d="M22 44V40.5c0-1.2 1-2.2 2.2-2.2h15.6c1.2 0 2.2 1 2.2 2.2V44" stroke="#78350f" strokeWidth="1.2" fill="none" opacity="0.55" />
      <ellipse cx="18" cy="40" rx="5" ry="7" fill="rgba(127,29,29,0.35)" />
      <ellipse cx="46" cy="40" rx="5" ry="7" fill="rgba(127,29,29,0.28)" />
      <path
        d="M27.5 13.5h9c1 0 1.8.85 1.8 1.85v1.4c0 .65-.55 1.2-1.2 1.2h-9.4c-.65 0-1.2-.55-1.2-1.2v-1.4c0-1 .8-1.85 1.8-1.85Z"
        fill="#292524"
      />
      <ellipse cx="32" cy="11.5" rx="4.2" ry="2.2" fill={`url(#${id}-wax)`} />
      <ellipse cx="32" cy="11" rx="3" ry="1.2" fill="rgba(255,255,255,0.12)" />
      <path
        d="M25.5 18h13c2 0 3.6 1.65 3.6 3.65v20.5c0 2-1.6 3.65-3.6 3.65h-13c-2 0-3.6-1.65-3.6-3.65V21.65c0-2 1.6-3.65 3.6-3.65Z"
        fill={`url(#${id}-glass)`}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="0.85"
      />
      <path
        d="M26.4 23h11.2c.65 0 1.15.55 1.15 1.15v17.8c0 .65-.5 1.15-1.15 1.15H26.4c-.65 0-1.15-.5-1.15-1.15V24.15c0-.6.5-1.15 1.15-1.15Z"
        fill={`url(#${id}-wine)`}
      />
      <rect x="26.2" y="29.5" width="11.6" height="6.2" rx="0.8" fill={`url(#${id}-label)`} />
      <path d="M27.5 31.8h9.2M27.5 33.5h6.2" stroke="#92400e" strokeWidth="0.65" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="32" cy="23.5" rx="3.4" ry="1.1" fill="rgba(255,255,255,0.22)" />
      <path d="M30 22.2 L32 20.8 L34 22.2" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.15" />
      <rect x="0" y="0" width="64" height="64" rx="15" fill={`url(#${id}-vignette)`} />
      <path d="M10 16 Q32 4 54 16 L54 24 Q32 14 10 24 Z" fill={`url(#${id}-shine)`} />
    </svg>
  );
}

/** PC Guide — setup gamer premium, controle + tela. */
export function PcGuideMark({ className }: MarkProps) {
  const id = 'pc-prem';
  return (
    <svg className={className} viewBox="0 0 64 64" width={64} height={64} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="6" y1="8" x2="58" y2="56">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="55%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="38%" cy="58%" r="48%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-pad`} x1="10" y1="26" x2="50" y2="42">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id={`${id}-accent`} x1="16" y1="28" x2="44" y2="36">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="36" y1="12" x2="52" y2="28">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="55%" r="58%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.52" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="32" y1="4" x2="32" y2="26">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <circle cx="24" cy="34" r="24" fill={`url(#${id}-glow)`} />
      <rect x="36" y="12" width="18" height="13" rx="2" fill={`url(#${id}-screen)`} stroke="rgba(103,232,249,0.35)" strokeWidth="0.9" />
      <rect x="37.5" y="13.5" width="15" height="9.5" rx="1.2" fill="#0ea5e9" opacity="0.18" />
      <path d="M40 17h12M40 19.2h8" stroke="#67e8f9" strokeWidth="0.75" strokeLinecap="round" opacity="0.85" />
      <rect x="42" y="25" width="6" height="2" rx="0.6" fill="#334155" />
      <path d="M44 12.5 L44 10.5 M46 12.5 L46 10.5" stroke="#67e8f9" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
      <path
        d="M10 32.5c0-4.2 3.4-7.6 7.6-7.6h22.8c4.2 0 7.6 3.4 7.6 7.6v5c0 4.2-3.4 7.6-7.6 7.6H17.6c-4.2 0-7.6-3.4-7.6-7.6v-5Z"
        fill={`url(#${id}-pad)`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.85"
      />
      <path
        d="M11 32.5c0-3.6 2.9-6.5 6.5-6.5h22c3.6 0 6.5 2.9 6.5 6.5"
        stroke={`url(#${id}-accent)`}
        strokeWidth="0.9"
        fill="none"
        opacity="0.75"
      />
      <circle cx="20" cy="35" r="4.5" fill={`url(#${id}-accent)`} />
      <circle cx="20" cy="35" r="2.5" fill="#0f172a" opacity="0.6" />
      <circle cx="20" cy="34.2" r="1" fill="rgba(255,255,255,0.35)" />
      <circle cx="38" cy="35" r="4.5" fill={`url(#${id}-accent)`} />
      <circle cx="38" cy="35" r="2.5" fill="#0f172a" opacity="0.6" />
      <circle cx="38" cy="34.2" r="1" fill="rgba(255,255,255,0.35)" />
      <rect x="22.5" y="33.2" width="13" height="4.2" rx="2.1" fill={`url(#${id}-accent)`} opacity="0.9" />
      <circle cx="29" cy="35.3" r="1.1" fill="#e0f2fe" />
      <path
        d="M15 41.5c1.4 1.8 3.6 3 6 3h16c2.4 0 4.6-1.2 6-3"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M48 18l2.2 2.2M50.2 18l-2.2 2.2" stroke="#67e8f9" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="52" cy="14" r="1" fill="#22d3ee" opacity="0.8" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.15" />
      <rect x="0" y="0" width="64" height="64" rx="15" fill={`url(#${id}-vignette)`} />
      <path d="M10 16 Q32 4 54 16 L54 24 Q32 14 10 24 Z" fill={`url(#${id}-shine)`} />
    </svg>
  );
}
