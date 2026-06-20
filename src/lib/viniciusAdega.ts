import {
  fetchAdegaItemsCloud,
  isCloudNewer,
  upsertAdegaItemsCloud,
} from './personalCloudSync';

const STORAGE_PREFIX = 'nexus-pessoal-adega';
const UPDATED_AT_SUFFIX = ':updated-at';

export const ADEGA_CATEGORY_PRESETS = [
  'Whisky',
  'Vinho',
  'Vinho espumante',
  'Cerveja',
  'Gin',
  'Vodka',
  'Rum',
  'Tequila',
  'Cachaça',
  'Licor',
  'Conhaque',
  'Outro',
] as const;

export type AdegaItem = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  quantity: number;
  volumeMl?: number;
  abv?: number;
  origin?: string;
  notes?: string;
  opened?: boolean;
  imageUrl?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdegaItemInput = {
  name: string;
  category: string;
  brand?: string;
  quantity: number;
  volumeMl?: number;
  abv?: number;
  origin?: string;
  notes?: string;
  opened?: boolean;
  imageUrl?: string;
  barcode?: string;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function updatedAtKey(userId: string): string {
  return `${STORAGE_PREFIX}${UPDATED_AT_SUFFIX}:${userId}`;
}

function readLocalUpdatedAt(userId: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(updatedAtKey(userId));
}

function writeLocalUpdatedAt(userId: string, iso: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(updatedAtKey(userId), iso);
}

function parseItems(raw: string | null): AdegaItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isValidItem);
  } catch {
    return [];
  }
}

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidItem(value: unknown): value is AdegaItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AdegaItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    typeof item.category === 'string' &&
    item.category.trim().length > 0 &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity >= 0 &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    (item.imageUrl == null || (typeof item.imageUrl === 'string' && isValidImageUrl(item.imageUrl))) &&
    (item.barcode == null || (typeof item.barcode === 'string' && item.barcode.trim().length > 0))
  );
}

export function loadAdegaItems(userId: string | undefined): AdegaItem[] {
  if (!userId || typeof localStorage === 'undefined') return [];
  const items = parseItems(localStorage.getItem(storageKey(userId)));
  return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function saveAdegaItems(userId: string, items: AdegaItem[]): void {
  if (typeof localStorage === 'undefined') return;
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota exceeded */
  }
  void upsertAdegaItemsCloud(userId, items).then((err) => {
    if (err) console.warn('[adega] sync:', err);
  });
}

export async function syncAdegaItemsFromCloud(userId: string): Promise<AdegaItem[] | null> {
  const cloud = await fetchAdegaItemsCloud(userId);
  if (!cloud) return null;

  const items = cloud.items.filter(isValidItem);
  if (!isCloudNewer(cloud.updatedAt, readLocalUpdatedAt(userId))) {
    return null;
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(items));
      writeLocalUpdatedAt(userId, cloud.updatedAt);
    } catch {
      /* quota exceeded */
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function createAdegaItemId(): string {
  return `adega-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeAdegaInput(input: AdegaItemInput): AdegaItemInput | null {
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name || !category) return null;

  const quantity = Math.max(0, Math.round(input.quantity || 0));
  const volumeMl =
    input.volumeMl != null && Number.isFinite(input.volumeMl) && input.volumeMl > 0
      ? Math.round(input.volumeMl)
      : undefined;
  const abv =
    input.abv != null && Number.isFinite(input.abv) && input.abv >= 0 && input.abv <= 100
      ? Math.round(input.abv * 10) / 10
      : undefined;

  return {
    name,
    category,
    brand: input.brand?.trim() || undefined,
    quantity: quantity || 1,
    volumeMl,
    abv,
    origin: input.origin?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    opened: Boolean(input.opened),
    imageUrl: input.imageUrl?.trim() && isValidImageUrl(input.imageUrl.trim()) ? input.imageUrl.trim() : undefined,
    barcode: input.barcode?.trim() || undefined,
  };
}

export function categoryEmoji(category: string): string {
  const key = category.toLowerCase();
  if (key.includes('whisky') || key.includes('whiskey')) return '🥃';
  if (key.includes('espumante') || key.includes('champagne')) return '🍾';
  if (key.includes('vinho')) return '🍷';
  if (key.includes('cerveja')) return '🍺';
  if (key.includes('gin')) return '🍸';
  if (key.includes('vodka')) return '🧊';
  if (key.includes('rum')) return '🏝️';
  if (key.includes('tequila')) return '🌵';
  if (key.includes('cachaça') || key.includes('cachaca')) return '🌿';
  if (key.includes('licor')) return '🍯';
  if (key.includes('conhaque')) return '🔥';
  return '🍶';
}

export function formatVolume(ml?: number): string | null {
  if (ml == null || ml <= 0) return null;
  if (ml >= 1000) return `${(ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`;
  return `${ml} ml`;
}

export function adegaStats(items: AdegaItem[]): {
  totalItems: number;
  totalBottles: number;
  categories: string[];
} {
  const categories = new Set<string>();
  let totalBottles = 0;
  for (const item of items) {
    categories.add(item.category);
    totalBottles += item.quantity;
  }
  return {
    totalItems: items.length,
    totalBottles,
    categories: [...categories].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  };
}
