import {
  fetchCoffeeStockCloud,
  isCloudNewer,
  upsertCoffeeStockCloud,
} from './personalCloudSync';

const STORAGE_PREFIX = 'nexus-pessoal-coffee-stock';
const UPDATED_AT_SUFFIX = ':updated-at';

export type CoffeeCapsuleSystem = 'dolce-gusto' | 'tres-coracoes' | 'nespresso';

export const COFFEE_CAPSULE_SYSTEMS: {
  id: CoffeeCapsuleSystem;
  label: string;
  icon: string;
}[] = [
  { id: 'dolce-gusto', label: 'Dolce Gusto', icon: '/img/personal/coffee/systems/dolce-gusto.svg' },
  {
    id: 'tres-coracoes',
    label: 'Três Corações',
    icon: '/img/personal/coffee/systems/tres-coracoes.svg',
  },
  {
    id: 'nespresso',
    label: 'Nespresso',
    icon: '/img/personal/coffee/systems/nespresso.svg',
  },
];

export const COFFEE_STOCK_CATEGORY_PRESETS = [
  'Cápsula Dolce Gusto',
  'Cápsula Três Corações',
  'Cápsula Nespresso',
  'Grão',
  'Moído',
  'Solúvel',
  'Equipamento',
  'Outro',
] as const;

export type CoffeeStockItem = {
  id: string;
  name: string;
  category: string;
  capsuleSystem?: CoffeeCapsuleSystem;
  brand?: string;
  intensity?: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  iconEmoji?: string;
  createdAt: string;
  updatedAt: string;
};

export type CoffeeStockInput = {
  name: string;
  category: string;
  capsuleSystem?: CoffeeCapsuleSystem;
  brand?: string;
  intensity?: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  iconEmoji?: string;
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

function isValidImageUrl(value: string): boolean {
  if (value.startsWith('/')) return value.length > 1;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidItem(value: unknown): value is CoffeeStockItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CoffeeStockItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    typeof item.category === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity >= 0 &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    (item.imageUrl == null || (typeof item.imageUrl === 'string' && isValidImageUrl(item.imageUrl))) &&
    (item.capsuleSystem == null ||
      item.capsuleSystem === 'dolce-gusto' ||
      item.capsuleSystem === 'tres-coracoes' ||
      item.capsuleSystem === 'nespresso')
  );
}

export function loadCoffeeStock(userId: string | undefined): CoffeeStockItem[] {
  if (!userId || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isValidItem).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  } catch {
    return [];
  }
}

export function saveCoffeeStock(userId: string, items: CoffeeStockItem[]): void {
  if (typeof localStorage === 'undefined') return;
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota */
  }
  void upsertCoffeeStockCloud(userId, items).then((err) => {
    if (err) console.warn('[coffee stock] sync:', err);
  });
}

export async function syncCoffeeStockFromCloud(userId: string): Promise<CoffeeStockItem[] | null> {
  const cloud = await fetchCoffeeStockCloud(userId);
  if (!cloud) return null;
  const items = cloud.items.filter(isValidItem);
  if (!isCloudNewer(cloud.updatedAt, readLocalUpdatedAt(userId))) return null;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(items));
      writeLocalUpdatedAt(userId, cloud.updatedAt);
    } catch {
      /* quota */
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function createCoffeeStockId(): string {
  return `coffee-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function categoryToCapsuleSystem(category: string): CoffeeCapsuleSystem | undefined {
  const key = category.toLowerCase();
  if (key.includes('dolce')) return 'dolce-gusto';
  if (key.includes('nespresso')) return 'nespresso';
  if (key.includes('três') || key.includes('tres') || key.includes('corac')) return 'tres-coracoes';
  return undefined;
}

export function normalizeCoffeeStockInput(input: CoffeeStockInput): CoffeeStockInput | null {
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name || !category) return null;
  const quantity = Math.max(0, Math.round(input.quantity || 0));
  const intensity =
    input.intensity != null && input.intensity >= 1 && input.intensity <= 12
      ? Math.round(input.intensity)
      : undefined;
  return {
    name,
    category,
    capsuleSystem: input.capsuleSystem ?? categoryToCapsuleSystem(category),
    brand: input.brand?.trim() || undefined,
    intensity,
    quantity: quantity || 1,
    notes: input.notes?.trim() || undefined,
    imageUrl:
      input.imageUrl?.trim() && isValidImageUrl(input.imageUrl.trim())
        ? input.imageUrl.trim()
        : undefined,
    iconEmoji: input.iconEmoji?.trim() || categoryEmoji(category),
  };
}

export function categoryEmoji(category: string): string {
  const key = category.toLowerCase();
  if (key.includes('dolce')) return '☕';
  if (key.includes('nespresso')) return '◼';
  if (key.includes('três') || key.includes('tres')) return '❤️';
  if (key.includes('grão') || key.includes('grao')) return '🫘';
  if (key.includes('moído') || key.includes('moido')) return '🟤';
  if (key.includes('solúvel') || key.includes('soluvel')) return '🥄';
  if (key.includes('equip')) return '⚙️';
  return '☕';
}

export function capsuleSystemIcon(system?: CoffeeCapsuleSystem): string | null {
  if (!system) return null;
  return COFFEE_CAPSULE_SYSTEMS.find((entry) => entry.id === system)?.icon ?? null;
}
