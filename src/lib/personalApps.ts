export type PersonalAppIcon =
  | { type: 'image'; src: string }
  | { type: 'material'; name: string; tone?: 'cyan' | 'green' | 'violet' }
  | { type: 'todoist' }
  | { type: 'the-news' }
  | { type: 'drinks-carta' }
  | { type: 'adega' }
  | { type: 'pc-guide' }
  | { type: 'emoji'; value: string }
  | { type: 'piggy' }
  | { type: 'letter'; value: string };

export type PersonalInternalAction = 'finance' | 'drinks' | 'pc-guide' | 'adega';

export type PersonalAppDefinition = {
  id: string;
  label: string;
  subtitle?: string;
  kind: 'internal' | 'external';
  internalAction?: PersonalInternalAction;
  href?: string;
  icon: PersonalAppIcon;
  viniciusOnly?: boolean;
};

export type PersonalCustomApp = {
  id: string;
  label: string;
  href: string;
};

/** Catálogo fixo — apps que o utilizador pode adicionar à home. */
export const PERSONAL_APP_CATALOG: PersonalAppDefinition[] = [
  {
    id: 'finance',
    label: 'Finanças',
    subtitle: 'Contas pessoais',
    kind: 'internal',
    internalAction: 'finance',
    icon: { type: 'piggy' },
  },
  {
    id: 'drinks',
    label: 'Carta de drinks',
    subtitle: 'Receitas',
    kind: 'internal',
    internalAction: 'drinks',
    icon: { type: 'drinks-carta' },
    viniciusOnly: true,
  },
  {
    id: 'pc-guide',
    label: 'PC Guide',
    subtitle: 'Controles e PC',
    kind: 'internal',
    internalAction: 'pc-guide',
    icon: { type: 'pc-guide' },
    viniciusOnly: true,
  },
  {
    id: 'adega',
    label: 'Adega',
    subtitle: 'Coleção',
    kind: 'internal',
    internalAction: 'adega',
    icon: { type: 'adega' },
    viniciusOnly: true,
  },
  {
    id: 'jardim-elizabeth',
    label: 'Jardim Elizabeth',
    subtitle: 'Congregação',
    kind: 'external',
    href: 'https://jardimelizabeth.vercel.app/',
    icon: { type: 'material', name: 'nature_people', tone: 'green' },
    viniciusOnly: true,
  },
  {
    id: 'todoist',
    label: 'Todoist',
    subtitle: 'Tarefas',
    kind: 'external',
    href: 'https://todoist.com/app',
    icon: { type: 'todoist' },
  },
  {
    id: 'texto-diario',
    label: 'Texto diário',
    subtitle: 'Leitura',
    kind: 'external',
    href: 'https://wol.jw.org/pt/wol/h/r5/lp-t',
    icon: { type: 'image', src: '/img/apps/texto-diario.png' },
  },
  {
    id: 'the-news',
    label: 'the news',
    subtitle: 'Podcast',
    kind: 'external',
    href: 'https://open.spotify.com/show/5cYtKjFwlRCSZKyV6ZC8Wq',
    icon: { type: 'the-news' },
  },
  {
    id: 'spotify',
    label: 'Spotify',
    subtitle: 'Música',
    kind: 'external',
    href: 'https://open.spotify.com/',
    icon: { type: 'image', src: '/img/streaming/spotify.png' },
  },
  {
    id: 'youtube-music',
    label: 'YouTube Music',
    subtitle: 'Música',
    kind: 'external',
    href: 'https://music.youtube.com/',
    icon: { type: 'image', src: '/img/apps/youtube-music.png' },
  },
];

export type ResolvedPersonalApp = PersonalAppDefinition;

export function catalogForUser(viniciusOnly: boolean): PersonalAppDefinition[] {
  return PERSONAL_APP_CATALOG.filter((app) => !app.viniciusOnly || viniciusOnly);
}

export function defaultAppOrder(viniciusOnly: boolean): string[] {
  return catalogForUser(viniciusOnly).map((app) => app.id);
}

export function customAppToDefinition(custom: PersonalCustomApp): ResolvedPersonalApp {
  const letter = custom.label.trim().charAt(0).toUpperCase() || '?';
  return {
    id: custom.id,
    label: custom.label,
    subtitle: 'Atalho',
    kind: 'external',
    href: custom.href,
    icon: { type: 'letter', value: letter },
  };
}

export function resolveAppById(
  id: string,
  catalog: PersonalAppDefinition[],
  customApps: PersonalCustomApp[],
  iconOverrides?: Record<string, PersonalAppIcon>,
): ResolvedPersonalApp | null {
  const builtin = catalog.find((app) => app.id === id);
  if (builtin) {
    const override = iconOverrides?.[id];
    return override ? { ...builtin, icon: override } : builtin;
  }
  const custom = customApps.find((app) => app.id === id);
  if (custom) {
    const base = customAppToDefinition(custom);
    const override = iconOverrides?.[id];
    return override ? { ...base, icon: override } : base;
  }
  return null;
}

export function createCustomAppId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeCustomHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}
