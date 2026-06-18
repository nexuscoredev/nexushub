import type { PersonalAppDefinition, PersonalAppIcon } from './personalApps';

/** Emojis rápidos para personalizar tiles */
export const PERSONAL_APP_EMOJI_OPTIONS = [
  '🏠', '📱', '💼', '🎵', '🎮', '📚', '✈️', '🍕',
  '☕', '💡', '🔗', '⭐', '❤️', '🎯', '📊', '🌐',
  '🛒', '💰', '🎬', '📝', '🔧', '⚡', '🌿', '🍸',
] as const;

export type PersonalAppMaterialOption = {
  name: string;
  tone?: 'cyan' | 'green' | 'violet';
};

/** Ícones Material para atalhos */
export const PERSONAL_APP_MATERIAL_OPTIONS: PersonalAppMaterialOption[] = [
  { name: 'link', tone: 'cyan' },
  { name: 'open_in_new', tone: 'cyan' },
  { name: 'language', tone: 'cyan' },
  { name: 'home', tone: 'cyan' },
  { name: 'music_note', tone: 'violet' },
  { name: 'sports_esports', tone: 'violet' },
  { name: 'restaurant', tone: 'green' },
  { name: 'flight', tone: 'cyan' },
  { name: 'shopping_bag', tone: 'cyan' },
  { name: 'work', tone: 'cyan' },
  { name: 'school', tone: 'green' },
  { name: 'favorite', tone: 'violet' },
  { name: 'star', tone: 'cyan' },
  { name: 'settings', tone: 'cyan' },
  { name: 'cloud', tone: 'cyan' },
  { name: 'photo', tone: 'green' },
  { name: 'nature_people', tone: 'green' },
  { name: 'podcasts', tone: 'violet' },
];

export function parseEmojiIcon(raw: string): PersonalAppIcon | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const chars = [...trimmed];
  if (chars.length !== 1) return null;
  return { type: 'emoji', value: chars[0] };
}

export function parseImageIconUrl(raw: string): PersonalAppIcon | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { type: 'image', src: url.href };
  } catch {
    return null;
  }
}

export function parseLetterIcon(raw: string, fallbackLabel: string): PersonalAppIcon {
  const char = raw.trim().charAt(0).toUpperCase() || fallbackLabel.charAt(0).toUpperCase() || '?';
  return { type: 'letter', value: char };
}

export function isPersonalAppIcon(value: unknown): value is PersonalAppIcon {
  if (!value || typeof value !== 'object') return false;
  const icon = value as PersonalAppIcon;
  switch (icon.type) {
    case 'piggy':
    case 'todoist':
    case 'the-news':
      return true;
    case 'emoji':
      return typeof icon.value === 'string' && icon.value.length > 0;
    case 'letter':
      return typeof icon.value === 'string' && icon.value.length > 0;
    case 'image':
      return typeof icon.src === 'string' && icon.src.length > 0;
    case 'material':
      return typeof icon.name === 'string' && icon.name.length > 0;
    default:
      return false;
  }
}

export function iconsEqual(a: PersonalAppIcon, b: PersonalAppIcon): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function defaultIconForApp(
  id: string,
  catalog: PersonalAppDefinition[],
  customApps: { id: string; label: string }[],
): PersonalAppIcon | null {
  const builtin = catalog.find((app) => app.id === id);
  if (builtin) return builtin.icon;
  const custom = customApps.find((app) => app.id === id);
  if (custom) {
    const letter = custom.label.trim().charAt(0).toUpperCase() || '?';
    return { type: 'letter', value: letter };
  }
  return null;
}
