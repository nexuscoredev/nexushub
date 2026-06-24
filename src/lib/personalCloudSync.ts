import type { PersonalAppLayout } from './personalAppLayout';
import type { PersonalAppIcon } from './personalApps';
import { persistRemoteImageRef } from './personalMediaStorage';
import { supabase, supabaseErrorMessage } from './supabase';
import type { AdegaItem } from './viniciusAdega';
import type { CoffeeCartaStore } from './viniciusCoffeeCartaStore';
import type { CoffeeStockItem } from './viniciusCoffeeStock';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { DrinkCartaStore } from './viniciusDrinksCartaStore';

type CloudRow = {
  updated_at: string;
};

export async function fetchPersonalAppLayoutCloud(
  userId: string,
): Promise<{ layout: PersonalAppLayout; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_app_layout')
    .select('layout, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.layout) return null;

  const layout = data.layout as PersonalAppLayout;
  if (!layout || !Array.isArray(layout.order)) return null;

  return { layout, updatedAt: data.updated_at };
}

export async function hydratePersonalAppLayoutForCloud(
  userId: string,
  layout: PersonalAppLayout,
): Promise<PersonalAppLayout> {
  const iconOverrides: Record<string, PersonalAppIcon> = {};

  for (const [appId, icon] of Object.entries(layout.iconOverrides ?? {})) {
    if (icon.type !== 'image' || !icon.src.startsWith('data:image/')) {
      iconOverrides[appId] = icon;
      continue;
    }
    const url = await persistRemoteImageRef(userId, icon.src, `app-icons/${appId}`);
    iconOverrides[appId] = { type: 'image', src: url };
  }

  return { ...layout, iconOverrides };
}

export async function upsertPersonalAppLayoutCloud(
  userId: string,
  layout: PersonalAppLayout,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const hydrated = await hydratePersonalAppLayoutForCloud(userId, layout);
  const updatedAt = new Date().toISOString();

  const { error } = await supabase.from('hub_personal_app_layout').upsert(
    {
      user_id: userId,
      layout: hydrated,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export async function fetchDrinkCartaStoreCloud(
  userId: string,
): Promise<{ store: DrinkCartaStore; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_drinks_carta')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.data) return null;

  const store = data.data as DrinkCartaStore;
  if (!store || typeof store !== 'object') return null;

  return {
    store: {
      overrides: store.overrides ?? {},
      bannerImageUrl: store.bannerImageUrl,
      customDrinks: Array.isArray(store.customDrinks) ? store.customDrinks : undefined,
    },
    updatedAt: data.updated_at,
  };
}

export async function hydrateDrinkCartaStoreForCloud(
  userId: string,
  store: DrinkCartaStore,
): Promise<DrinkCartaStore> {
  const overrides = { ...(store.overrides ?? {}) };

  for (const [slug, override] of Object.entries(overrides)) {
    if (override.imageUrl?.startsWith('data:image/')) {
      overrides[slug] = {
        ...override,
        imageUrl: await persistRemoteImageRef(userId, override.imageUrl, `drinks-carta/${slug}`),
      };
    }
  }

  let bannerImageUrl = store.bannerImageUrl;
  if (bannerImageUrl?.startsWith('data:image/')) {
    bannerImageUrl = await persistRemoteImageRef(userId, bannerImageUrl, 'drinks-carta/banner');
  }

  const customDrinks: ViniciusDrink[] = [];
  for (const drink of store.customDrinks ?? []) {
    let imageUrl = drink.imageUrl;
    if (imageUrl.startsWith('data:image/')) {
      imageUrl = await persistRemoteImageRef(userId, imageUrl, `drinks-carta/${drink.slug}`);
    }
    customDrinks.push({ ...drink, imageUrl });
  }

  return { overrides, bannerImageUrl, customDrinks: customDrinks.length ? customDrinks : undefined };
}

export async function upsertDrinkCartaStoreCloud(
  userId: string,
  store: DrinkCartaStore,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const hydrated = await hydrateDrinkCartaStoreForCloud(userId, store);
  const updatedAt = new Date().toISOString();

  const { error } = await supabase.from('hub_personal_drinks_carta').upsert(
    {
      user_id: userId,
      data: hydrated,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export async function fetchAdegaItemsCloud(
  userId: string,
): Promise<{ items: AdegaItem[]; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_adega')
    .select('items, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.items) return null;
  if (!Array.isArray(data.items)) return null;

  return { items: data.items as AdegaItem[], updatedAt: data.updated_at };
}

export async function upsertAdegaItemsCloud(
  userId: string,
  items: AdegaItem[],
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('hub_personal_adega').upsert(
    {
      user_id: userId,
      items,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export async function fetchCoffeeStockCloud(
  userId: string,
): Promise<{ items: CoffeeStockItem[]; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_coffee_stock')
    .select('items, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.items) return null;
  if (!Array.isArray(data.items)) return null;

  return { items: data.items as CoffeeStockItem[], updatedAt: data.updated_at };
}

export async function upsertCoffeeStockCloud(
  userId: string,
  items: CoffeeStockItem[],
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('hub_personal_coffee_stock').upsert(
    { user_id: userId, items, updated_at: updatedAt },
    { onConflict: 'user_id' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export async function fetchCoffeeCartaStoreCloud(
  userId: string,
): Promise<{ store: CoffeeCartaStore; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hub_personal_coffee_carta')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.data) return null;
  const store = data.data as CoffeeCartaStore;
  if (!store || typeof store !== 'object') return null;

  return {
    store: {
      overrides: store.overrides ?? {},
      bannerImageUrl: store.bannerImageUrl,
      customRecipes: Array.isArray(store.customRecipes) ? store.customRecipes : undefined,
    },
    updatedAt: data.updated_at,
  };
}

export async function upsertCoffeeCartaStoreCloud(
  userId: string,
  store: CoffeeCartaStore,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('hub_personal_coffee_carta').upsert(
    { user_id: userId, data: store, updated_at: updatedAt },
    { onConflict: 'user_id' },
  );

  return error ? supabaseErrorMessage(error) : null;
}

export function isCloudNewer(cloudUpdatedAt: string, localUpdatedAt: string | null): boolean {
  if (!localUpdatedAt) return true;
  return Date.parse(cloudUpdatedAt) > Date.parse(localUpdatedAt);
}

export type { CloudRow };
