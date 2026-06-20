import {
  drinkThumbPath,
  VINICIUS_DRINKS,
  VINICIUS_DRINKS_BANNER_URL,
  type ViniciusDrink,
} from './viniciusDrinksCarta';

const STORAGE_PREFIX = 'nexus-pessoal-drinks-carta';

export type DrinkCartaOverride = {
  imageUrl?: string;
  title?: string;
  tagline?: string;
  ingredients?: string[];
  steps?: string[];
  notes?: string;
};

export type DrinkCartaStore = {
  overrides: Record<string, DrinkCartaOverride>;
  bannerImageUrl?: string;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function isValidImageUrl(value: string): boolean {
  if (value.startsWith('data:image/')) return value.length <= 500_000;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidOverride(value: unknown): value is DrinkCartaOverride {
  if (!value || typeof value !== 'object') return false;
  const o = value as DrinkCartaOverride;
  if (o.imageUrl != null && (typeof o.imageUrl !== 'string' || !isValidImageUrl(o.imageUrl))) {
    return false;
  }
  if (o.title != null && typeof o.title !== 'string') return false;
  if (o.tagline != null && typeof o.tagline !== 'string') return false;
  if (o.notes != null && typeof o.notes !== 'string') return false;
  if (o.ingredients != null && (!Array.isArray(o.ingredients) || !o.ingredients.every((i) => typeof i === 'string'))) {
    return false;
  }
  if (o.steps != null && (!Array.isArray(o.steps) || !o.steps.every((s) => typeof s === 'string'))) {
    return false;
  }
  return true;
}

function shouldDropBannerOverride(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/')) return true;
  if (lower.includes('/drinks/thumbs/')) return true;
  const official = VINICIUS_DRINKS_BANNER_URL.split('?')[0].toLowerCase();
  if (lower.includes('/drinks/banner') && !lower.startsWith(official)) return true;
  return false;
}

function migrateDrinkCartaStore(store: DrinkCartaStore): DrinkCartaStore {
  if (store.bannerImageUrl && shouldDropBannerOverride(store.bannerImageUrl)) {
    return { ...store, bannerImageUrl: undefined };
  }
  return store;
}

function parseStore(raw: string | null): DrinkCartaStore {
  if (!raw) return { overrides: {} };
  try {
    const data = JSON.parse(raw) as Partial<DrinkCartaStore>;
    const overrides: Record<string, DrinkCartaOverride> = {};
    if (data.overrides && typeof data.overrides === 'object') {
      for (const [slug, override] of Object.entries(data.overrides)) {
        if (isValidOverride(override)) overrides[slug] = override;
      }
    }
    const bannerImageUrl =
      typeof data.bannerImageUrl === 'string' && isValidImageUrl(data.bannerImageUrl)
        ? data.bannerImageUrl
        : undefined;
    return { overrides, bannerImageUrl };
  } catch {
    return { overrides: {} };
  }
}

export function loadDrinkCartaStore(userId: string | undefined): DrinkCartaStore {
  if (!userId || typeof localStorage === 'undefined') return { overrides: {} };
  const store = parseStore(localStorage.getItem(storageKey(userId)));
  const migrated = migrateDrinkCartaStore(store);
  if (migrated !== store) {
    saveDrinkCartaStore(userId, migrated);
  }
  return migrated;
}

export function saveDrinkCartaStore(userId: string, store: DrinkCartaStore): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(store));
}

export function mergeDrink(base: ViniciusDrink, override?: DrinkCartaOverride): ViniciusDrink {
  if (!override) return base;
  return {
    ...base,
    title: override.title?.trim() || base.title,
    tagline: override.tagline?.trim() || base.tagline,
    imageUrl: override.imageUrl || base.imageUrl,
    ingredients: override.ingredients?.length ? override.ingredients : base.ingredients,
    steps: override.steps?.length ? override.steps : base.steps,
    notes: override.notes !== undefined ? override.notes.trim() || undefined : base.notes,
  };
}

export function resolveDrinks(store: DrinkCartaStore, catalog = VINICIUS_DRINKS): ViniciusDrink[] {
  return catalog.map((drink) => mergeDrink(drink, store.overrides[drink.slug]));
}

export function findResolvedDrink(
  slug: string | null | undefined,
  store: DrinkCartaStore,
  catalog = VINICIUS_DRINKS,
): ViniciusDrink | undefined {
  if (!slug) return undefined;
  const base = catalog.find((d) => d.slug === slug);
  if (!base) return undefined;
  return mergeDrink(base, store.overrides[slug]);
}

export function defaultDrinkImageUrl(slug: string): string {
  return drinkThumbPath(slug);
}

export function hasDrinkOverride(store: DrinkCartaStore, slug: string): boolean {
  return Boolean(store.overrides[slug] && Object.keys(store.overrides[slug]).length > 0);
}

export function updateDrinkOverride(
  store: DrinkCartaStore,
  slug: string,
  patch: DrinkCartaOverride,
): DrinkCartaStore {
  const current = store.overrides[slug] ?? {};
  const next: DrinkCartaOverride = { ...current, ...patch };

  for (const key of Object.keys(next) as (keyof DrinkCartaOverride)[]) {
    if (next[key] === undefined) delete next[key];
  }

  const overrides = { ...store.overrides };
  if (Object.keys(next).length === 0) delete overrides[slug];
  else overrides[slug] = next;

  return { ...store, overrides };
}

export function clearDrinkOverrideField(
  store: DrinkCartaStore,
  slug: string,
  field: keyof DrinkCartaOverride,
): DrinkCartaStore {
  const current = { ...(store.overrides[slug] ?? {}) };
  delete current[field];
  const overrides = { ...store.overrides };
  if (Object.keys(current).length === 0) delete overrides[slug];
  else overrides[slug] = current;
  return { ...store, overrides };
}

export function listToLines(items: string[]): string {
  return items.join('\n');
}

export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
