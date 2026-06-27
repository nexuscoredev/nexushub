import type { CoffeeCupSize } from './viniciusCoffeeStock';
import type { CoffeeCapsuleSystem } from './viniciusCoffeeStock';
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
