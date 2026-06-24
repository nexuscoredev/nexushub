import type { CoffeeCapsuleSystem } from './viniciusCoffeeStock';
import { categoryToCapsuleSystem } from './viniciusCoffeeStock';

export type CoffeeCapsuleCatalog = {
  label: string;
  catalogUrl: string;
  site: string;
};

export const COFFEE_CAPSULE_CATALOGS: Record<CoffeeCapsuleSystem, CoffeeCapsuleCatalog> = {
  'dolce-gusto': {
    label: 'Nescafé Dolce Gusto',
    catalogUrl: 'https://www.nescafe-dolcegusto.com.br/sabores',
    site: 'nescafe-dolcegusto.com.br',
  },
  'tres-coracoes': {
    label: 'Três Corações',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/',
    site: 'cafe3coracoes.com.br',
  },
  nespresso: {
    label: 'Nespresso',
    catalogUrl: 'https://www.nespresso.com/br/pt/order/capsules/original',
    site: 'nespresso.com',
  },
};

export function resolveCoffeeCapsuleSystem(category: string): CoffeeCapsuleSystem | undefined {
  return categoryToCapsuleSystem(category);
}

export function coffeeCapsuleCatalogUrl(system: CoffeeCapsuleSystem): string {
  return COFFEE_CAPSULE_CATALOGS[system].catalogUrl;
}

export function coffeeCapsuleCatalogLabel(system: CoffeeCapsuleSystem): string {
  return COFFEE_CAPSULE_CATALOGS[system].label;
}

/** Termos para busca automática (API) — prioriza o site oficial da marca. */
export function coffeeCapsuleImageApiQuery(parts: {
  name: string;
  brand?: string;
  category: string;
}): { query: string; capsuleSystem?: CoffeeCapsuleSystem } {
  const terms = [parts.name, parts.brand, 'cápsula']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  const capsuleSystem = resolveCoffeeCapsuleSystem(parts.category);
  return { query: terms, capsuleSystem };
}

/** Query para Google Imagens com site oficial quando for cápsula. */
export function coffeeCapsuleGoogleImagesQuery(parts: {
  name: string;
  brand?: string;
  category: string;
}): string {
  const { query, capsuleSystem } = coffeeCapsuleImageApiQuery(parts);
  if (capsuleSystem) {
    const site = COFFEE_CAPSULE_CATALOGS[capsuleSystem].site;
    return `${query} site:${site}`;
  }
  return `${query} cápsula café`;
}

export function openCoffeeCapsuleCatalog(system: CoffeeCapsuleSystem): void {
  window.open(coffeeCapsuleCatalogUrl(system), '_blank', 'noopener,noreferrer');
}
