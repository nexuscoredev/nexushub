import {
  VINICIUS_DRINKS,
  type ViniciusDrink,
} from './viniciusDrinksCarta';
import { repairCustomDrinkImage, suggestionDrinkThumbPath } from './drinkCartaSuggestions';
import {
  fetchDrinkCartaStoreCloud,
  isCloudNewer,
  upsertDrinkCartaStoreCloud,
} from './personalCloudSync';

const STORAGE_PREFIX = 'nexus-pessoal-drinks-carta';
const UPDATED_AT_SUFFIX = ':updated-at';

export type DrinkCartaOverride = {
  imageUrl?: string;
  title?: string;
  tagline?: string;
  ingredients?: string[];
  steps?: string[];
  notes?: string;
  garnish?: string[];
  variations?: string[];
};

export type DrinkPersonalMeta = {
  rating?: 1 | 2 | 3 | 4 | 5;
  tried?: boolean;
  wantToTry?: boolean;
  tastingNote?: string;
};

export type DrinkCartaStore = {
  overrides: Record<string, DrinkCartaOverride>;
  customDrinks?: ViniciusDrink[];
  bannerImageUrl?: string;
  favorites?: string[];
  hiddenSlugs?: string[];
  drinkMeta?: Record<string, DrinkPersonalMeta>;
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
  if (value.startsWith('data:image/')) return value.length <= 900_000;
  if (value.startsWith('/')) return value.length > 1;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidDrink(value: unknown): value is ViniciusDrink {
  if (!value || typeof value !== 'object') return false;
  const drink = value as Partial<ViniciusDrink>;
  return (
    typeof drink.slug === 'string' &&
    drink.slug.trim().length > 0 &&
    typeof drink.title === 'string' &&
    drink.title.trim().length > 0 &&
    typeof drink.tagline === 'string' &&
    typeof drink.imageUrl === 'string' &&
    isValidImageUrl(drink.imageUrl) &&
    Array.isArray(drink.ingredients) &&
    drink.ingredients.length > 0 &&
    drink.ingredients.every((item) => typeof item === 'string' && item.trim().length > 0) &&
    Array.isArray(drink.steps) &&
    drink.steps.length > 0 &&
    drink.steps.every((item) => typeof item === 'string' && item.trim().length > 0) &&
    (drink.notes == null || typeof drink.notes === 'string') &&
    (drink.garnish == null ||
      (Array.isArray(drink.garnish) &&
        drink.garnish.every((item) => typeof item === 'string' && item.trim().length > 0))) &&
    (drink.variations == null ||
      (Array.isArray(drink.variations) &&
        drink.variations.every((item) => typeof item === 'string' && item.trim().length > 0)))
  );
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
  if (
    o.garnish != null &&
    (!Array.isArray(o.garnish) || !o.garnish.every((g) => typeof g === 'string'))
  ) {
    return false;
  }
  if (
    o.variations != null &&
    (!Array.isArray(o.variations) || !o.variations.every((v) => typeof v === 'string'))
  ) {
    return false;
  }
  return true;
}

function shouldDropBannerOverride(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes('/drinks/thumbs/')) return true;
  if (lower.includes('/drinks/banner') && !lower.includes('/img/personal/drinks/banner.png')) {
    return true;
  }
  return false;
}

function migrateDrinkCartaStore(store: DrinkCartaStore): DrinkCartaStore {
  let next = store;
  if (store.bannerImageUrl && shouldDropBannerOverride(store.bannerImageUrl)) {
    next = { ...next, bannerImageUrl: undefined };
  }
  if (store.customDrinks?.length) {
    const customDrinks = store.customDrinks.map(repairCustomDrinkImage);
    const changed = customDrinks.some(
      (drink, index) => drink.imageUrl !== store.customDrinks![index].imageUrl,
    );
    if (changed) {
      next = { ...next, customDrinks };
    }
  }
  return next;
}

function isValidDrinkMeta(value: unknown): value is DrinkPersonalMeta {
  if (!value || typeof value !== 'object') return false;
  const meta = value as DrinkPersonalMeta;
  if (
    meta.rating != null &&
    (!Number.isInteger(meta.rating) || meta.rating < 1 || meta.rating > 5)
  ) {
    return false;
  }
  if (meta.tried != null && typeof meta.tried !== 'boolean') return false;
  if (meta.wantToTry != null && typeof meta.wantToTry !== 'boolean') return false;
  if (meta.tastingNote != null && typeof meta.tastingNote !== 'string') return false;
  return true;
}

function parseDrinkMeta(value: unknown): Record<string, DrinkPersonalMeta> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const result: Record<string, DrinkPersonalMeta> = {};
  for (const [slug, meta] of Object.entries(value as Record<string, unknown>)) {
    if (slug.trim() && isValidDrinkMeta(meta)) result[slug] = meta;
  }
  return Object.keys(result).length ? result : undefined;
}

function parseSlugList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const slugs = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return slugs.length ? slugs : undefined;
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
    const customDrinks = Array.isArray(data.customDrinks)
      ? data.customDrinks.filter(isValidDrink).map(repairCustomDrinkImage)
      : undefined;
    const favorites = parseSlugList(data.favorites);
    const hiddenSlugs = parseSlugList(data.hiddenSlugs);
    const drinkMeta = parseDrinkMeta(data.drinkMeta);
    return { overrides, bannerImageUrl, customDrinks, favorites, hiddenSlugs, drinkMeta };
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
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota exceeded */
  }
  void upsertDrinkCartaStoreCloud(userId, store).then((err) => {
    if (err) console.warn('[drinks carta] sync:', err);
  });
}

export async function syncDrinkCartaStoreFromCloud(
  userId: string,
): Promise<DrinkCartaStore | null> {
  const cloud = await fetchDrinkCartaStoreCloud(userId);
  if (!cloud) return null;

  const migrated = migrateDrinkCartaStore(cloud.store);
  if (!isCloudNewer(cloud.updatedAt, readLocalUpdatedAt(userId))) {
    return null;
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(migrated));
      writeLocalUpdatedAt(userId, cloud.updatedAt);
    } catch {
      /* quota exceeded */
    }
  }
  return migrated;
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
    garnish: override.garnish?.length ? override.garnish : base.garnish,
    variations: override.variations?.length ? override.variations : base.variations,
  };
}

export function resolveDrinks(store: DrinkCartaStore, catalog = VINICIUS_DRINKS): ViniciusDrink[] {
  const base = catalog.map((drink) => mergeDrink(drink, store.overrides[drink.slug]));
  const custom = (store.customDrinks ?? []).map((drink) => mergeDrink(drink, store.overrides[drink.slug]));
  return [...base, ...custom];
}

export function findResolvedDrink(
  slug: string | null | undefined,
  store: DrinkCartaStore,
  catalog = VINICIUS_DRINKS,
): ViniciusDrink | undefined {
  if (!slug) return undefined;
  const base = catalog.find((d) => d.slug === slug);
  const custom = store.customDrinks?.find((d) => d.slug === slug);
  const drink = base ?? custom;
  if (!drink) return undefined;
  return mergeDrink(drink, store.overrides[slug]);
}

export function listCartaSlugs(store: DrinkCartaStore, catalog = VINICIUS_DRINKS): Set<string> {
  const slugs = new Set(catalog.map((drink) => drink.slug));
  for (const drink of store.customDrinks ?? []) slugs.add(drink.slug);
  return slugs;
}

export function addCustomDrink(store: DrinkCartaStore, drink: ViniciusDrink): DrinkCartaStore {
  if (!isValidDrink(drink)) return store;
  if (listCartaSlugs(store).has(drink.slug)) return store;
  return {
    ...store,
    customDrinks: [...(store.customDrinks ?? []), drink],
  };
}

export function addCustomDrinks(store: DrinkCartaStore, drinks: ViniciusDrink[]): DrinkCartaStore {
  let next = store;
  for (const drink of drinks) {
    next = addCustomDrink(next, drink);
  }
  return next;
}

export function defaultDrinkImageUrl(slug: string, store?: DrinkCartaStore): string {
  const catalog = VINICIUS_DRINKS.find((drink) => drink.slug === slug);
  if (catalog) return catalog.imageUrl;
  const custom = store?.customDrinks?.find((drink) => drink.slug === slug);
  if (custom) return custom.imageUrl;
  return suggestionDrinkThumbPath(slug);
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

export function isFavorite(store: DrinkCartaStore, slug: string): boolean {
  return store.favorites?.includes(slug) ?? false;
}

export function toggleFavorite(store: DrinkCartaStore, slug: string): DrinkCartaStore {
  const current = store.favorites ?? [];
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
  return { ...store, favorites: next.length ? next : undefined };
}

export function toggleHidden(store: DrinkCartaStore, slug: string): DrinkCartaStore {
  const current = store.hiddenSlugs ?? [];
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
  return { ...store, hiddenSlugs: next.length ? next : undefined };
}

export function filterVisibleDrinks(
  drinks: ViniciusDrink[],
  store: DrinkCartaStore,
): ViniciusDrink[] {
  const hidden = new Set(store.hiddenSlugs ?? []);
  if (!hidden.size) return drinks;
  return drinks.filter((drink) => !hidden.has(drink.slug));
}

export function getDrinkMeta(store: DrinkCartaStore, slug: string): DrinkPersonalMeta {
  return store.drinkMeta?.[slug] ?? {};
}

export function updateDrinkMeta(
  store: DrinkCartaStore,
  slug: string,
  patch: Partial<DrinkPersonalMeta>,
): DrinkCartaStore {
  const current = store.drinkMeta?.[slug] ?? {};
  const next: DrinkPersonalMeta = { ...current, ...patch };

  for (const key of Object.keys(next) as (keyof DrinkPersonalMeta)[]) {
    if (next[key] === undefined) delete next[key];
  }

  const drinkMeta = { ...(store.drinkMeta ?? {}) };
  if (Object.keys(next).length === 0) delete drinkMeta[slug];
  else drinkMeta[slug] = next;

  return {
    ...store,
    drinkMeta: Object.keys(drinkMeta).length ? drinkMeta : undefined,
  };
}

export function listTriedSlugs(store: DrinkCartaStore): string[] {
  return Object.entries(store.drinkMeta ?? {})
    .filter(([, meta]) => meta.tried)
    .map(([slug]) => slug);
}

export function listWantToTrySlugs(store: DrinkCartaStore): string[] {
  return Object.entries(store.drinkMeta ?? {})
    .filter(([, meta]) => meta.wantToTry)
    .map(([slug]) => slug);
}
