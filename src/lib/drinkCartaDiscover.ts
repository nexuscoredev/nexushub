import { filterDrinksByCollection, type DrinkCollectionId } from './drinkCartaCollections';
import {
  aggregateShoppingList,
  filterDrinksByAdega,
  getDrinkSuggestions,
  matchDrinkToAdega,
  type DrinkAdegaMatch,
} from './drinkAdegaMatch';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

export type { DrinkCollectionId };
export { DRINK_COLLECTIONS } from './drinkCartaCollections';

export type DrinkCategoryId =
  | 'classico'
  | 'gin'
  | 'whisky'
  | 'vodka'
  | 'rum'
  | 'tequila'
  | 'cachaca'
  | 'cerveja'
  | 'sem-alcool';

export const DRINK_CATEGORY_CHIPS: { id: DrinkCategoryId; label: string }[] = [
  { id: 'classico', label: 'Clássico' },
  { id: 'gin', label: 'Gin' },
  { id: 'whisky', label: 'Whisky' },
  { id: 'vodka', label: 'Vodka' },
  { id: 'rum', label: 'Rum' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'cachaca', label: 'Cachaça' },
  { id: 'cerveja', label: 'Cerveja' },
  { id: 'sem-alcool', label: 'Sem álcool' },
];

const CATEGORY_PATTERNS: { id: DrinkCategoryId; patterns: RegExp[] }[] = [
  { id: 'gin', patterns: [/\bgin\b/i] },
  { id: 'whisky', patterns: [/whisky|u[ií]sque/i] },
  { id: 'vodka', patterns: [/vodka/i] },
  { id: 'rum', patterns: [/rum/i] },
  { id: 'tequila', patterns: [/tequila/i] },
  { id: 'cachaca', patterns: [/cacha[cç]a/i] },
  { id: 'cerveja', patterns: [/cerveja|pilsen|chopp/i] },
];

const CLASSIC_SLUGS = new Set([
  'negroni',
  'dry-martini',
  'vesper-martini',
  'daiquiri',
  'margarita',
  'whisky-sour',
  'mojito',
  'moscow-mule',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function hasSpirit(drink: ViniciusDrink, pattern: RegExp): boolean {
  const haystack = normalizeText(
    [drink.title, drink.tagline, ...drink.ingredients].join(' '),
  );
  return pattern.test(haystack);
}

function hasAnyAlcohol(drink: ViniciusDrink): boolean {
  const haystack = normalizeText(
    [drink.title, drink.tagline, ...drink.ingredients].join(' '),
  );
  return /whisky|u[ií]sque|vodka|\bgin\b|rum|tequila|cacha[cç]a|saqu[eê]|cerveja|campari|vermouth|vermute|bitter|aperol|cointreau|cura[cç]au|licor|\d+\s*ml.*(?:whisky|vodka|gin|rum|tequila)/i.test(
    haystack,
  );
}

export function inferDrinkCategory(drink: ViniciusDrink): DrinkCategoryId {
  const explicit = drink.category as DrinkCategoryId | undefined;
  if (explicit && DRINK_CATEGORY_CHIPS.some((chip) => chip.id === explicit)) return explicit;
  if (CLASSIC_SLUGS.has(drink.slug)) return 'classico';
  if (!hasAnyAlcohol(drink)) return 'sem-alcool';

  for (const rule of CATEGORY_PATTERNS) {
    if (rule.patterns.some((pattern) => hasSpirit(drink, pattern))) {
      return rule.id;
    }
  }

  return 'classico';
}

export function searchDrinks(drinks: ViniciusDrink[], query: string): ViniciusDrink[] {
  const q = normalizeText(query.trim());
  if (!q) return drinks;

  return drinks.filter((drink) => {
    const haystack = normalizeText(
      [drink.title, drink.tagline, drink.notes ?? '', ...drink.ingredients, ...(drink.steps ?? [])].join(
        ' ',
      ),
    );
    return haystack.includes(q);
  });
}

export function filterDrinksByCategory(
  drinks: ViniciusDrink[],
  category: DrinkCategoryId | null,
): ViniciusDrink[] {
  if (!category) return drinks;
  return drinks.filter((drink) => inferDrinkCategory(drink) === category);
}

export function filterDrinksBySpirit(
  drinks: ViniciusDrink[],
  spiritId: DrinkCategoryId | string | null,
): ViniciusDrink[] {
  if (!spiritId || spiritId === 'classico' || spiritId === 'sem-alcool') {
    return filterDrinksByCategory(drinks, spiritId as DrinkCategoryId | null);
  }

  const rule = CATEGORY_PATTERNS.find((entry) => entry.id === spiritId);
  if (!rule) return drinks;
  return drinks.filter((drink) => rule.patterns.some((pattern) => hasSpirit(drink, pattern)));
}

export type DrinkFlavorId =
  | 'refrescante'
  | 'doce'
  | 'azedo'
  | 'amargo'
  | 'forte'
  | 'cremoso';

export const DRINK_FLAVOR_CHIPS: { id: DrinkFlavorId; label: string }[] = [
  { id: 'refrescante', label: 'Refrescante' },
  { id: 'doce', label: 'Doce' },
  { id: 'azedo', label: 'Azedo' },
  { id: 'amargo', label: 'Amargo' },
  { id: 'forte', label: 'Forte' },
  { id: 'cremoso', label: 'Cremoso' },
];

const FLAVOR_PATTERNS: { id: DrinkFlavorId; patterns: RegExp[] }[] = [
  {
    id: 'refrescante',
    patterns: [/hortel[aã]|menta|água com gás|agua com gas|ginger beer|mule|tonic|collins|spritz/i],
  },
  {
    id: 'doce',
    patterns: [/a[cç][uú]car|xarope|mel|cola|coca|cura[cç]au|licor|doce/i],
  },
  {
    id: 'azedo',
    patterns: [/lim[aã]o|limao|sour|c[ií]tric|azul|maracuj[aá]/i],
  },
  {
    id: 'amargo',
    patterns: [/campari|negroni|bitter|aperol|vermute|vermouth|rosso/i],
  },
  {
    id: 'forte',
    patterns: [/60\s*ml|50\s*ml|batido|neat|encorpado|forte/i],
  },
  {
    id: 'cremoso',
    patterns: [/clara|egg|cream|cremoso|espuma|batido pra ficar cremoso/i],
  },
];

function drinkHaystack(drink: ViniciusDrink): string {
  return normalizeText(
    [drink.title, drink.tagline, drink.notes ?? '', ...drink.ingredients, ...drink.steps].join(' '),
  );
}

export function inferDrinkFlavors(drink: ViniciusDrink): DrinkFlavorId[] {
  const haystack = drinkHaystack(drink);
  const flavors: DrinkFlavorId[] = [];
  for (const rule of FLAVOR_PATTERNS) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      flavors.push(rule.id);
    }
  }
  return flavors.length ? flavors : ['refrescante'];
}

export function filterDrinksByFlavor(
  drinks: ViniciusDrink[],
  flavor: DrinkFlavorId | null,
): ViniciusDrink[] {
  if (!flavor) return drinks;
  return drinks.filter((drink) => inferDrinkFlavors(drink).includes(flavor));
}

export function filterDrinksByBaseSpirit(
  drinks: ViniciusDrink[],
  baseId: DrinkCategoryId | null,
): ViniciusDrink[] {
  if (!baseId || baseId === 'classico' || baseId === 'sem-alcool' || baseId === 'cerveja') {
    return filterDrinksByCategory(drinks, baseId);
  }
  return filterDrinksBySpirit(drinks, baseId);
}
export function filterDrinksByIngredientQuery(
  drinks: ViniciusDrink[],
  ingredientQuery: string,
): ViniciusDrink[] {
  const q = normalizeText(ingredientQuery.trim());
  if (!q) return drinks;
  return drinks.filter((drink) =>
    drink.ingredients.some((item) => normalizeText(item).includes(q)),
  );
}

export type PartyModeSuggestion = {
  drink: ViniciusDrink;
  match: DrinkAdegaMatch;
  score: number;
  servings: number;
};

export function rankPartyModeDrinks(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
  guestCount: number,
): PartyModeSuggestion[] {
  const guests = Math.max(1, Math.min(24, Math.round(guestCount)));
  const suggestions = getDrinkSuggestions(drinks, adegaItems);
  const candidates = [...suggestions.ready, ...suggestions.almost.filter((s) => s.match.missingLabels.length <= 2)];

  const ranked = candidates.map(({ drink, match }) => {
    const matchedCount = match.matches.length;
    const missingPenalty = match.missingLabels.length * 2;
    const readyBonus = match.status === 'ready' ? 5 : 0;
    const usageScore = matchedCount + readyBonus - missingPenalty;
    const servings = Math.max(1, Math.ceil(guests / Math.max(1, candidates.length)));
    return { drink, match, score: usageScore, servings };
  });

  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      a.match.missingLabels.length - b.match.missingLabels.length ||
      a.drink.title.localeCompare(b.drink.title, 'pt-BR'),
  );

  return ranked.slice(0, Math.min(6, ranked.length));
}

export type BarShareSnapshot = {
  v: 1;
  ready: string[];
  almost: string[];
};

export function encodeBarShare(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
): string {
  const { ready, almost } = getDrinkSuggestions(drinks, adegaItems);
  const snapshot: BarShareSnapshot = {
    v: 1,
    ready: ready.map(({ drink }) => drink.title),
    almost: almost
      .filter(({ match }) => match.missingLabels.length <= 2)
      .map(({ drink }) => drink.title),
  };
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBarShare(param: string): BarShareSnapshot | null {
  if (!param.trim()) return null;
  try {
    let base64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = atob(base64);
    const data = JSON.parse(json) as Partial<BarShareSnapshot>;
    if (data.v !== 1) return null;
    if (!Array.isArray(data.ready) || !Array.isArray(data.almost)) return null;
    const ready = data.ready.filter((item): item is string => typeof item === 'string');
    const almost = data.almost.filter((item): item is string => typeof item === 'string');
    return { v: 1, ready, almost };
  } catch {
    return null;
  }
}

export function applyDiscoverFilters(
  drinks: ViniciusDrink[],
  options: {
    search?: string;
    category?: DrinkCategoryId | null;
    spirit?: DrinkCategoryId | null;
    baseSpirit?: DrinkCategoryId | null;
    flavor?: DrinkFlavorId | null;
    collection?: DrinkCollectionId | null;
    ingredient?: string;
    adegaItems?: AdegaItem[];
    adegaMode?: 'all' | 'ready' | 'almost' | 'partial';
    favoritesOnly?: boolean;
    triedOnly?: boolean;
    wantToTryOnly?: boolean;
    favoriteSlugs?: Set<string>;
    triedSlugs?: Set<string>;
    wantToTrySlugs?: Set<string>;
  },
): ViniciusDrink[] {
  let result = drinks;

  if (options.favoritesOnly && options.favoriteSlugs) {
    result = result.filter((drink) => options.favoriteSlugs!.has(drink.slug));
  }

  if (options.triedOnly && options.triedSlugs) {
    result = result.filter((drink) => options.triedSlugs!.has(drink.slug));
  }

  if (options.wantToTryOnly && options.wantToTrySlugs) {
    result = result.filter((drink) => options.wantToTrySlugs!.has(drink.slug));
  }

  if (options.collection) {
    result = filterDrinksByCollection(result, options.collection, options.adegaItems);
  }

  if (options.search?.trim()) {
    result = searchDrinks(result, options.search);
  }

  if (options.category) {
    result = filterDrinksByCategory(result, options.category);
  }

  if (options.spirit) {
    result = filterDrinksBySpirit(result, options.spirit);
  }

  if (options.baseSpirit) {
    result = filterDrinksByBaseSpirit(result, options.baseSpirit);
  }

  if (options.flavor) {
    result = filterDrinksByFlavor(result, options.flavor);
  }

  if (options.ingredient?.trim()) {
    result = filterDrinksByIngredientQuery(result, options.ingredient);
  }

  if (options.adegaItems && options.adegaMode && options.adegaMode !== 'all') {
    result = filterDrinksByAdega(result, options.adegaItems, options.adegaMode);
  }

  return result;
}

export { aggregateShoppingList, matchDrinkToAdega };
