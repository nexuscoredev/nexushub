import type { CoffeeCupSize } from './viniciusCoffeeStock';
import type { CoffeeCapsuleSystem, CoffeeStockItem } from './viniciusCoffeeStock';
import { categoryEmoji, createCoffeeStockId } from './viniciusCoffeeStock';
import { COFFEE_CAPSULE_CATALOGS } from './coffeeCapsuleImageSearch';
import dolceGusto from '../data/coffeeCapsuleCatalog/dolce-gusto.json';
import nespresso from '../data/coffeeCapsuleCatalog/nespresso.json';
import tresCoracoes from '../data/coffeeCapsuleCatalog/tres-coracoes.json';

export type CoffeeCatalogImages = {
  /** Embalagem / caixa (foto principal do produto). */
  box?: string;
  /** Cápsula isolada (tampa visível). */
  capsule?: string;
  /** Ícone ou foto do tamanho da xícara (ex.: 30 ml). */
  serving?: string;
  /** Fotos extras (verso, lifestyle, etc.). */
  gallery?: string[];
};

export type CoffeeCapsuleCatalogEntry = {
  slug: string;
  system: CoffeeCapsuleSystem;
  name: string;
  brand?: string;
  intensity?: number;
  packSize?: number;
  cupSize?: CoffeeCupSize;
  cupVolumeMl?: number;
  origin?: string;
  flavorNotes?: string;
  description?: string;
  ingredients?: string;
  coffeeType?: string;
  priceReference?: number;
  catalogUrl?: string;
  images: CoffeeCatalogImages;
  /** Metadados do scrape — imagens ainda não baixadas. */
  imagesPending?: boolean;
};

const ALL_ENTRIES: CoffeeCapsuleCatalogEntry[] = [
  ...(dolceGusto as CoffeeCapsuleCatalogEntry[]),
  ...(nespresso as CoffeeCapsuleCatalogEntry[]),
  ...(tresCoracoes as CoffeeCapsuleCatalogEntry[]),
];

export const COFFEE_CAPSULE_CATALOG_COUNT = ALL_ENTRIES.length;

export const COFFEE_CAPSULE_CATALOG_BY_SYSTEM: Record<CoffeeCapsuleSystem, number> = {
  'dolce-gusto': (dolceGusto as CoffeeCapsuleCatalogEntry[]).length,
  nespresso: (nespresso as CoffeeCapsuleCatalogEntry[]).length,
  'tres-coracoes': (tresCoracoes as CoffeeCapsuleCatalogEntry[]).length,
};

export function listCoffeeCapsuleCatalog(system?: CoffeeCapsuleSystem): CoffeeCapsuleCatalogEntry[] {
  if (!system) return ALL_ENTRIES;
  return ALL_ENTRIES.filter((entry) => entry.system === system);
}

export function findCoffeeCapsuleCatalogEntry(
  slug: string | null | undefined,
): CoffeeCapsuleCatalogEntry | undefined {
  if (!slug) return undefined;
  return ALL_ENTRIES.find((entry) => entry.slug === slug);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function searchCoffeeCapsuleCatalog(
  query: string,
  system?: CoffeeCapsuleSystem | null,
): CoffeeCapsuleCatalogEntry[] {
  const q = normalizeText(query.trim());
  let list = system ? listCoffeeCapsuleCatalog(system) : ALL_ENTRIES;
  if (!q) return list;

  return list.filter((entry) => {
    const haystack = normalizeText(
      [entry.name, entry.brand ?? '', entry.flavorNotes ?? '', entry.origin ?? ''].join(' '),
    );
    return haystack.includes(q);
  });
}

export function catalogEntryPrimaryImage(entry: CoffeeCapsuleCatalogEntry): string | undefined {
  return entry.images.box ?? entry.images.capsule ?? entry.images.gallery?.[0];
}

export function catalogEntryGalleryImages(entry: CoffeeCapsuleCatalogEntry): string[] {
  const urls = [
    entry.images.box,
    entry.images.capsule,
    entry.images.serving,
    ...(entry.images.gallery ?? []),
  ].filter((url): url is string => Boolean(url));
  return [...new Set(urls)];
}

export function catalogEntryCategory(entry: CoffeeCapsuleCatalogEntry): string {
  if (entry.system === 'dolce-gusto') return 'Cápsula Dolce Gusto';
  if (entry.system === 'nespresso') return 'Cápsula Nespresso';
  return 'Cápsula Três Corações';
}

export function catalogEntryToStockPrefill(entry: CoffeeCapsuleCatalogEntry) {
  const primary = catalogEntryPrimaryImage(entry);
  const gallery = catalogEntryGalleryImages(entry).filter((url) => url !== primary);
  return {
    name: entry.brand ? `${entry.brand} ${entry.name}`.trim() : entry.name,
    category: catalogEntryCategory(entry),
    brand: entry.brand,
    intensity: entry.intensity,
    packSize: entry.packSize,
    cupSize: entry.cupSize,
    origin: entry.origin,
    flavorNotes: entry.flavorNotes,
    description: entry.description,
    ingredients: entry.ingredients,
    pricePaid: entry.priceReference,
    catalogUrl: entry.catalogUrl ?? COFFEE_CAPSULE_CATALOGS[entry.system].catalogUrl,
    imageUrl: primary,
    extraImageUrls: gallery,
    catalogSlug: entry.slug,
  };
}

export type CoffeeCatalogStockPrefill = ReturnType<typeof catalogEntryToStockPrefill>;

export const CATALOG_DISPLAY_ID_PREFIX = 'catalog:';

export function catalogDisplayId(entry: Pick<CoffeeCapsuleCatalogEntry, 'system' | 'slug'>): string {
  return `${CATALOG_DISPLAY_ID_PREFIX}${entry.system}:${entry.slug}`;
}

export function isCatalogDisplayId(id: string): boolean {
  return id.startsWith(CATALOG_DISPLAY_ID_PREFIX);
}

export function parseCatalogDisplayId(
  id: string,
): { system: CoffeeCapsuleSystem; slug: string } | null {
  if (!isCatalogDisplayId(id)) return null;
  const rest = id.slice(CATALOG_DISPLAY_ID_PREFIX.length);
  const splitAt = rest.indexOf(':');
  if (splitAt <= 0) return null;
  const system = rest.slice(0, splitAt) as CoffeeCapsuleSystem;
  const slug = rest.slice(splitAt + 1);
  if (!slug) return null;
  return { system, slug };
}

function mergeCatalogEntryWithStock(
  entry: CoffeeCapsuleCatalogEntry,
  stock?: CoffeeStockItem,
): CoffeeStockItem {
  const prefill = catalogEntryToStockPrefill(entry);
  const now = new Date().toISOString();
  if (stock) {
    return {
      ...stock,
      name: stock.name || prefill.name,
      category: stock.category || prefill.category,
      capsuleSystem: entry.system,
      catalogSlug: entry.slug,
      imageUrl: stock.imageUrl ?? prefill.imageUrl,
      extraImageUrls: stock.extraImageUrls?.length ? stock.extraImageUrls : prefill.extraImageUrls,
      brand: stock.brand ?? prefill.brand,
      intensity: stock.intensity ?? prefill.intensity,
      flavorNotes: stock.flavorNotes ?? prefill.flavorNotes,
      description: stock.description ?? prefill.description,
      ingredients: stock.ingredients ?? prefill.ingredients,
      origin: stock.origin ?? prefill.origin,
      cupSize: stock.cupSize ?? prefill.cupSize,
      packSize: stock.packSize ?? prefill.packSize,
      pricePaid: stock.pricePaid ?? prefill.pricePaid,
      catalogUrl: stock.catalogUrl ?? prefill.catalogUrl,
    };
  }
  return {
    id: catalogDisplayId(entry),
    name: prefill.name,
    category: prefill.category,
    capsuleSystem: entry.system,
    brand: prefill.brand,
    intensity: prefill.intensity,
    quantity: 0,
    imageUrl: prefill.imageUrl,
    extraImageUrls: prefill.extraImageUrls,
    catalogSlug: entry.slug,
    catalogUrl: prefill.catalogUrl,
    description: prefill.description,
    ingredients: prefill.ingredients,
    origin: prefill.origin,
    flavorNotes: prefill.flavorNotes,
    cupSize: prefill.cupSize,
    packSize: prefill.packSize,
    pricePaid: prefill.pricePaid,
    iconEmoji: categoryEmoji(prefill.category),
    createdAt: now,
    updatedAt: now,
  };
}

/** Catálogo embutido (72) + estoque pessoal (quantidade, favoritos, extras). */
export function resolveCoffeeDisplayStock(stock: CoffeeStockItem[]): CoffeeStockItem[] {
  const stockByCatalogKey = new Map<string, CoffeeStockItem>();
  const customItems: CoffeeStockItem[] = [];

  for (const item of stock) {
    if (item.catalogSlug && item.capsuleSystem) {
      stockByCatalogKey.set(`${item.capsuleSystem}:${item.catalogSlug}`, item);
      continue;
    }
    customItems.push(item);
  }

  const catalogItems = ALL_ENTRIES.map((entry) => {
    const key = `${entry.system}:${entry.slug}`;
    const override = stockByCatalogKey.get(key);
    stockByCatalogKey.delete(key);
    return mergeCatalogEntryWithStock(entry, override);
  });

  const orphanCatalogStock = [...stockByCatalogKey.values()];
  return [...catalogItems, ...orphanCatalogStock, ...customItems].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export function catalogEntryToStockItem(
  entry: CoffeeCapsuleCatalogEntry,
  overrides: Partial<CoffeeStockItem> & { id?: string } = {},
): CoffeeStockItem {
  const prefill = catalogEntryToStockPrefill(entry);
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? createCoffeeStockId(),
    name: prefill.name,
    category: prefill.category,
    capsuleSystem: entry.system,
    brand: prefill.brand,
    intensity: prefill.intensity,
    quantity: overrides.quantity ?? 0,
    favorite: overrides.favorite,
    notes: overrides.notes,
    imageUrl: prefill.imageUrl,
    extraImageUrls: prefill.extraImageUrls,
    catalogSlug: entry.slug,
    catalogUrl: prefill.catalogUrl,
    description: prefill.description,
    ingredients: prefill.ingredients,
    origin: prefill.origin,
    flavorNotes: prefill.flavorNotes,
    cupSize: prefill.cupSize,
    packSize: prefill.packSize,
    pricePaid: prefill.pricePaid,
    iconEmoji: categoryEmoji(prefill.category),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}
