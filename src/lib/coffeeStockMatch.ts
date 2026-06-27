import type { ViniciusCoffeeRecipe } from './viniciusCoffeeCarta';
import type { CoffeeStockItem, CoffeeCapsuleSystem } from './viniciusCoffeeStock';

const CAPSULE_STOCK_LABELS: Record<CoffeeCapsuleSystem, string> = {
  'dolce-gusto': 'Cápsula Dolce Gusto',
  'tres-coracoes': 'Cápsula Três Corações',
  nespresso: 'Cápsula Nespresso',
};

export type CoffeeStockMatchStatus = 'ready' | 'partial' | 'missing';

export type CoffeeStockMatch = {
  slug: string;
  status: CoffeeStockMatchStatus;
  missingLabels: string[];
  matches: { label: string; itemName: string }[];
  /** Receita de cápsula: sempre na carta; estoque é opcional (controle). */
  catalogCapsule?: boolean;
};

/** Cápsulas vêm prontas — ficam na carta sem depender do estoque. */
export function isCapsuleCartaRecipe(recipe: ViniciusCoffeeRecipe): boolean {
  return recipe.method === 'capsula';
}

/** Preparos que exigem café moído/grão (ou similar) no estoque. */
export function recipeUsesStock(recipe: ViniciusCoffeeRecipe): boolean {
  return !isCapsuleCartaRecipe(recipe);
}

function hasStockCapsule(
  items: CoffeeStockItem[],
  system: ViniciusCoffeeRecipe['capsuleSystem'],
): CoffeeStockItem | null {
  if (!system) return null;
  return (
    items.find(
      (item) =>
        item.quantity > 0 &&
        (item.capsuleSystem === system ||
          item.category.toLowerCase().includes(system.replace('-', ' '))),
    ) ?? null
  );
}

function hasGroundCoffee(items: CoffeeStockItem[]): boolean {
  return items.some(
    (item) =>
      item.quantity > 0 &&
      /grão|grao|moído|moido/i.test(item.category),
  );
}

export function matchCoffeeRecipeToStock(
  recipe: ViniciusCoffeeRecipe,
  stock: CoffeeStockItem[],
): CoffeeStockMatch {
  const available = stock.filter((item) => item.quantity > 0);
  const matches: CoffeeStockMatch['matches'] = [];
  const missingLabels: string[] = [];

  if (isCapsuleCartaRecipe(recipe)) {
    if (recipe.capsuleSystem) {
      const hit = hasStockCapsule(available, recipe.capsuleSystem);
      const label = CAPSULE_STOCK_LABELS[recipe.capsuleSystem];
      if (hit) matches.push({ label, itemName: hit.name });
    } else {
      const anyCapsule = available.find((item) => /cápsula|capsula/i.test(item.category));
      if (anyCapsule) matches.push({ label: 'Cápsula', itemName: anyCapsule.name });
    }

    return {
      slug: recipe.slug,
      status: 'ready',
      missingLabels: [],
      matches,
      catalogCapsule: true,
    };
  }

  if (recipe.method === 'filtro' || recipe.method === 'prensa') {
    const hit = available.find((item) => /grão|grao|moído|moido/i.test(item.category));
    if (hit) matches.push({ label: 'Café moído/grão', itemName: hit.name });
    else if (!hasGroundCoffee(available)) missingLabels.push('Café moído ou grão');
  }

  let status: CoffeeStockMatchStatus = 'missing';
  if (missingLabels.length === 0) status = 'ready';
  else if (matches.length > 0) status = 'partial';

  return { slug: recipe.slug, status, missingLabels, matches };
}

export function matchCoffeeRecipesToStock(
  recipes: ViniciusCoffeeRecipe[],
  stock: CoffeeStockItem[],
): Map<string, CoffeeStockMatch> {
  return new Map(recipes.map((recipe) => [recipe.slug, matchCoffeeRecipeToStock(recipe, stock)]));
}

export function filterCoffeeByStock(
  recipes: ViniciusCoffeeRecipe[],
  stock: CoffeeStockItem[],
  mode: 'ready' | 'almost' | 'all',
): ViniciusCoffeeRecipe[] {
  if (mode === 'all') return recipes;
  const matches = matchCoffeeRecipesToStock(recipes, stock);
  return recipes.filter((recipe) => {
    if (isCapsuleCartaRecipe(recipe)) {
      return mode === 'ready';
    }
    const match = matches.get(recipe.slug);
    if (!match) return false;
    if (mode === 'ready') return match.status === 'ready';
    return match.status === 'partial';
  });
}

export function getRecipesForStockItem(
  item: CoffeeStockItem,
  recipes: ViniciusCoffeeRecipe[],
): ViniciusCoffeeRecipe[] {
  return recipes.filter((recipe) => {
    const match = matchCoffeeRecipeToStock(recipe, [item]);
    return match.matches.some((entry) => entry.itemName === item.name);
  });
}

export function countRecipesForStockItem(
  item: CoffeeStockItem,
  recipes: ViniciusCoffeeRecipe[],
): number {
  return recipes.filter((recipe) => {
    const match = matchCoffeeRecipeToStock(recipe, [item]);
    return match.matches.some((entry) => entry.itemName === item.name);
  }).length;
}
