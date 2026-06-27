import {
  filterCoffeeByStock,
  isCapsuleCartaRecipe,
  matchCoffeeRecipesToStock,
  type CoffeeStockMatch,
} from './coffeeStockMatch';
import type { CoffeeBrewMethod, ViniciusCoffeeRecipe } from './viniciusCoffeeCarta';
import type { CoffeeCapsuleSystem, CoffeeStockItem } from './viniciusCoffeeStock';
import { COFFEE_CAPSULE_SYSTEMS } from './viniciusCoffeeStock';

export type CoffeeStockFilterMode = 'all' | 'ready' | 'almost';

export type CoffeeDiscoverFilters = {
  search: string;
  method: CoffeeBrewMethod | null;
  capsuleSystem: CoffeeCapsuleSystem | null;
  stockMode: CoffeeStockFilterMode;
};

export const COFFEE_METHOD_CHIPS: { id: CoffeeBrewMethod; label: string }[] = [
  { id: 'capsula', label: 'Cápsula' },
  { id: 'filtro', label: 'Filtro' },
  { id: 'prensa', label: 'Prensa' },
  { id: 'espresso-manual', label: 'Espresso manual' },
  { id: 'outro', label: 'Outro' },
];

export const COFFEE_SYSTEM_CHIPS = COFFEE_CAPSULE_SYSTEMS.map((system) => ({
  id: system.id,
  label: system.label,
}));

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function searchCoffeeRecipes(
  recipes: ViniciusCoffeeRecipe[],
  query: string,
): ViniciusCoffeeRecipe[] {
  const q = normalizeText(query.trim());
  if (!q) return recipes;

  return recipes.filter((recipe) => {
    const haystack = normalizeText(
      [recipe.title, recipe.tagline, recipe.notes ?? '', ...recipe.ingredients, ...recipe.steps].join(
        ' ',
      ),
    );
    return haystack.includes(q);
  });
}

export function filterCoffeeByMethod(
  recipes: ViniciusCoffeeRecipe[],
  method: CoffeeBrewMethod | null,
): ViniciusCoffeeRecipe[] {
  if (!method) return recipes;
  return recipes.filter((recipe) => recipe.method === method);
}

export function filterCoffeeByCapsuleSystem(
  recipes: ViniciusCoffeeRecipe[],
  system: CoffeeCapsuleSystem | null,
): ViniciusCoffeeRecipe[] {
  if (!system) return recipes;
  return recipes.filter((recipe) => recipe.capsuleSystem === system);
}

export function coffeeMethodLabel(method: CoffeeBrewMethod): string {
  return COFFEE_METHOD_CHIPS.find((chip) => chip.id === method)?.label ?? method;
}

export function coffeeStockStatusLabel(
  recipe: ViniciusCoffeeRecipe,
  match: CoffeeStockMatch | undefined,
): string {
  if (isCapsuleCartaRecipe(recipe)) {
    if (match?.matches.length) return 'No estoque';
    return 'Cápsula';
  }
  if (!match) return '—';
  if (match.status === 'ready') return 'Pronto';
  if (match.status === 'partial') return `Falta: ${match.missingLabels.join(', ')}`;
  return 'Sem estoque';
}

export function getCoffeeStockCounts(
  recipes: ViniciusCoffeeRecipe[],
  stock: CoffeeStockItem[],
): { ready: number; almost: number } {
  const matches = matchCoffeeRecipesToStock(recipes, stock);
  let ready = 0;
  let almost = 0;
  for (const recipe of recipes) {
    if (isCapsuleCartaRecipe(recipe)) {
      ready += 1;
      continue;
    }
    const match = matches.get(recipe.slug);
    if (match?.status === 'ready') ready += 1;
    else if (match?.status === 'partial') almost += 1;
  }
  return { ready, almost };
}

export function applyCoffeeDiscoverFilters(
  recipes: ViniciusCoffeeRecipe[],
  stock: CoffeeStockItem[],
  filters: CoffeeDiscoverFilters,
): ViniciusCoffeeRecipe[] {
  let result = recipes;

  if (filters.search.trim()) {
    result = searchCoffeeRecipes(result, filters.search);
  }

  if (filters.method) {
    result = filterCoffeeByMethod(result, filters.method);
  }

  if (filters.capsuleSystem) {
    result = filterCoffeeByCapsuleSystem(result, filters.capsuleSystem);
  }

  if (filters.stockMode !== 'all') {
    result = filterCoffeeByStock(result, stock, filters.stockMode);
  }

  return result;
}

export function searchCoffeeStock(items: CoffeeStockItem[], query: string): CoffeeStockItem[] {
  const q = normalizeText(query.trim());
  if (!q) return items;

  return items.filter((item) => {
    const haystack = normalizeText(
      [item.name, item.brand ?? '', item.category, item.notes ?? ''].join(' '),
    );
    return haystack.includes(q);
  });
}

export function filterCoffeeStockByCategory(
  items: CoffeeStockItem[],
  category: string | null,
): CoffeeStockItem[] {
  if (!category) return items;
  return items.filter((item) => item.category === category);
}

export function coffeeStockCategoriesInUse(items: CoffeeStockItem[]): string[] {
  return [...new Set(items.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}

export { isCapsuleCartaRecipe, recipeUsesStock } from './coffeeStockMatch';
