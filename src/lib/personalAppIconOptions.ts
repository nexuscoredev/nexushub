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
  if (trimmed.startsWith('data:image/')) {
    return { type: 'image', src: trimmed };
  }
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { type: 'image', src: url.href };
  } catch {
    return null;
  }
}

export const PERSONAL_APP_ICON_MAX_BYTES = 2 * 1024 * 1024;
export const PERSONAL_APP_ICON_MAX_PX = 256;
const PERSONAL_APP_ICON_DATA_MAX_CHARS = 450_000;

const ICON_FILE_EXTENSIONS = new Set(['ico', 'icon', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']);

const ICON_FILE_MIME = new Set([
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function isAllowedIconFile(file: File): boolean {
  const ext = fileExtension(file.name);
  if (ICON_FILE_EXTENSIONS.has(ext)) return true;
  return !!file.type && ICON_FILE_MIME.has(file.type);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl: string, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height, 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas indisponível.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let out = canvas.toDataURL('image/webp', 0.88);
      if (!out.startsWith('data:image/webp')) {
        out = canvas.toDataURL('image/png');
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error('Imagem inválida.'));
    img.src = dataUrl;
  });
}

/** Converte arquivo local (.ico, .png, etc.) em ícone persistível (data URL). */
export async function fileToAppIconImage(file: File): Promise<PersonalAppIcon> {
  if (!isAllowedIconFile(file)) {
    throw new Error('Formato não suportado. Use .ico, .icon, .png, .jpg, .webp ou .svg.');
  }
  if (file.size > PERSONAL_APP_ICON_MAX_BYTES) {
    throw new Error('Arquivo grande demais (máx. 2 MB).');
  }

  const ext = fileExtension(file.name);
  const dataUrl = await readFileAsDataUrl(file);

  if (ext === 'svg' || file.type === 'image/svg+xml') {
    if (dataUrl.length > PERSONAL_APP_ICON_DATA_MAX_CHARS) {
      throw new Error('SVG grande demais para salvar no navegador.');
    }
    return { type: 'image', src: dataUrl };
  }

  try {
    const resized = await resizeImageDataUrl(dataUrl, PERSONAL_APP_ICON_MAX_PX);
    if (resized.length > PERSONAL_APP_ICON_DATA_MAX_CHARS) {
      throw new Error('Imagem grande demais após redimensionar.');
    }
    return { type: 'image', src: resized };
  } catch {
    if (dataUrl.length > PERSONAL_APP_ICON_DATA_MAX_CHARS) {
      throw new Error('Ícone grande demais. Tente um arquivo menor.');
    }
    return { type: 'image', src: dataUrl };
  }
}

export function imageIconSourceLabel(src: string): string | null {
  if (!src.startsWith('data:image/')) return null;
  if (src.startsWith('data:image/svg')) return 'SVG local';
  if (src.startsWith('data:image/x-icon') || src.startsWith('data:image/vnd.microsoft.icon')) {
    return 'Ícone .ico local';
  }
  return 'Imagem local';
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
    case 'drinks-carta':
    case 'adega':
    case 'pc-guide':
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
