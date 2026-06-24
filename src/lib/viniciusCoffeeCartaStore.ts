import {
  VINICIUS_COFFEE_RECIPES,
  type ViniciusCoffeeRecipe,
} from './viniciusCoffeeCarta';
import {
  fetchCoffeeCartaStoreCloud,
  isCloudNewer,
  upsertCoffeeCartaStoreCloud,
} from './personalCloudSync';

const STORAGE_PREFIX = 'nexus-pessoal-coffee-carta';
const UPDATED_AT_SUFFIX = ':updated-at';

export type CoffeeCartaOverride = {
  imageUrl?: string;
  title?: string;
  tagline?: string;
  ingredients?: string[];
  steps?: string[];
  notes?: string;
};

export type CoffeeCartaStore = {
  overrides: Record<string, CoffeeCartaOverride>;
  customRecipes?: ViniciusCoffeeRecipe[];
  bannerImageUrl?: string;
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

function isValidRecipe(value: unknown): value is ViniciusCoffeeRecipe {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as Partial<ViniciusCoffeeRecipe>;
  return (
    typeof recipe.slug === 'string' &&
    recipe.slug.trim().length > 0 &&
    typeof recipe.title === 'string' &&
    typeof recipe.tagline === 'string' &&
    typeof recipe.imageUrl === 'string' &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    Array.isArray(recipe.steps) &&
    recipe.steps.length > 0
  );
}

function isValidOverride(value: unknown): value is CoffeeCartaOverride {
  if (!value || typeof value !== 'object') return false;
  const o = value as CoffeeCartaOverride;
  if (o.imageUrl != null && (typeof o.imageUrl !== 'string' || !isValidImageUrl(o.imageUrl))) return false;
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

function parseStore(raw: string | null): CoffeeCartaStore {
  if (!raw) return { overrides: {} };
  try {
    const data = JSON.parse(raw) as Partial<CoffeeCartaStore>;
    const overrides: Record<string, CoffeeCartaOverride> = {};
    if (data.overrides && typeof data.overrides === 'object') {
      for (const [slug, override] of Object.entries(data.overrides)) {
        if (isValidOverride(override)) overrides[slug] = override;
      }
    }
    const bannerImageUrl =
      typeof data.bannerImageUrl === 'string' && isValidImageUrl(data.bannerImageUrl)
        ? data.bannerImageUrl
        : undefined;
    const customRecipes = Array.isArray(data.customRecipes)
      ? data.customRecipes.filter(isValidRecipe)
      : undefined;
    return { overrides, bannerImageUrl, customRecipes };
  } catch {
    return { overrides: {} };
  }
}

export function loadCoffeeCartaStore(userId: string | undefined): CoffeeCartaStore {
  if (!userId || typeof localStorage === 'undefined') return { overrides: {} };
  return parseStore(localStorage.getItem(storageKey(userId)));
}

export function saveCoffeeCartaStore(userId: string, store: CoffeeCartaStore): void {
  if (typeof localStorage === 'undefined') return;
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota */
  }
  void upsertCoffeeCartaStoreCloud(userId, store).then((err) => {
    if (err) console.warn('[coffee carta] sync:', err);
  });
}

export async function syncCoffeeCartaStoreFromCloud(
  userId: string,
): Promise<CoffeeCartaStore | null> {
  const cloud = await fetchCoffeeCartaStoreCloud(userId);
  if (!cloud) return null;
  if (!isCloudNewer(cloud.updatedAt, readLocalUpdatedAt(userId))) return null;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(cloud.store));
      writeLocalUpdatedAt(userId, cloud.updatedAt);
    } catch {
      /* quota */
    }
  }
  return cloud.store;
}

export function mergeCoffeeRecipe(
  base: ViniciusCoffeeRecipe,
  override?: CoffeeCartaOverride,
): ViniciusCoffeeRecipe {
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

export function resolveCoffeeRecipes(store: CoffeeCartaStore): ViniciusCoffeeRecipe[] {
  const base = VINICIUS_COFFEE_RECIPES.map((recipe) =>
    mergeCoffeeRecipe(recipe, store.overrides[recipe.slug]),
  );
  const custom = (store.customRecipes ?? []).map((recipe) =>
    mergeCoffeeRecipe(recipe, store.overrides[recipe.slug]),
  );
  return [...base, ...custom];
}

export function findResolvedCoffeeRecipe(
  slug: string | null | undefined,
  store: CoffeeCartaStore,
): ViniciusCoffeeRecipe | undefined {
  if (!slug) return undefined;
  const base = VINICIUS_COFFEE_RECIPES.find((r) => r.slug === slug);
  const custom = store.customRecipes?.find((r) => r.slug === slug);
  const recipe = base ?? custom;
  if (!recipe) return undefined;
  return mergeCoffeeRecipe(recipe, store.overrides[slug]);
}

export function updateCoffeeOverride(
  store: CoffeeCartaStore,
  slug: string,
  patch: CoffeeCartaOverride,
): CoffeeCartaStore {
  const current = store.overrides[slug] ?? {};
  const next: CoffeeCartaOverride = { ...current, ...patch };
  for (const key of Object.keys(next) as (keyof CoffeeCartaOverride)[]) {
    if (next[key] === undefined) delete next[key];
  }
  const overrides = { ...store.overrides };
  if (Object.keys(next).length === 0) delete overrides[slug];
  else overrides[slug] = next;
  return { ...store, overrides };
}

export function addCustomCoffeeRecipe(
  store: CoffeeCartaStore,
  recipe: ViniciusCoffeeRecipe,
): CoffeeCartaStore {
  if (!isValidRecipe(recipe)) return store;
  const slugs = new Set([
    ...VINICIUS_COFFEE_RECIPES.map((r) => r.slug),
    ...(store.customRecipes ?? []).map((r) => r.slug),
  ]);
  if (slugs.has(recipe.slug)) return store;
  return { ...store, customRecipes: [...(store.customRecipes ?? []), recipe] };
}

export function createCustomCoffeeSlug(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `custom-${base || 'receita'}-${Date.now().toString(36).slice(-4)}`;
}

export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(items: string[]): string {
  return items.join('\n');
}
