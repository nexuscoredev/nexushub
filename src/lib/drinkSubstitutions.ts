import {
  extractDrinkRequirementGroups,
  findSubstituteItemsForGroup,
  getDrinksForAdegaItem,
  matchDrinkToAdega,
  matchDrinksToAdega,
} from './drinkAdegaMatch';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

export type SubstitutionImpact = 'ideal' | 'ok' | 'stretch';

export type DrinkSubstitution = {
  groupLabel: string;
  recipeWants: string;
  useInstead: string;
  itemId: string;
  impact: SubstitutionImpact;
  note: string;
};

function impactNote(impact: SubstitutionImpact): string {
  if (impact === 'ideal') return 'Mesma família — deve funcionar bem.';
  if (impact === 'ok') return 'Substituto aceitável; o sabor pode mudar um pouco.';
  return 'Alternativa criativa — experimente com moderação.';
}

export function suggestDrinkSubstitutions(
  drink: ViniciusDrink,
  adegaItems: AdegaItem[],
): DrinkSubstitution[] {
  const match = matchDrinkToAdega(drink, adegaItems);
  if (match.status === 'ready') return [];

  const groups = extractDrinkRequirementGroups(drink);
  const usedIds = new Set(match.matches.map((entry) => entry.itemId));

  const suggestions: DrinkSubstitution[] = [];

  for (const label of match.missingLabels) {
    const group = groups.find((g) => g.label === label);
    if (!group) continue;

    const substitutes = findSubstituteItemsForGroup(group, adegaItems, usedIds);
    for (const item of substitutes.slice(0, 2)) {
      const impact: SubstitutionImpact = group.variant ? 'ok' : 'ideal';
      suggestions.push({
        groupLabel: label,
        recipeWants: label,
        useInstead: item.brand ? `${item.name} (${item.brand})` : item.name,
        itemId: item.id,
        impact,
        note: impactNote(impact),
      });
      usedIds.add(item.id);
    }
  }

  return suggestions;
}

export type UnlockPreview = {
  item: AdegaItem;
  drinksReady: number;
  drinkTitles: string[];
};

export function previewDrinksUnlockedByItem(
  item: AdegaItem,
  drinks: ViniciusDrink[],
  allItems: AdegaItem[],
): UnlockPreview {
  const simulated = allItems.map((entry) =>
    entry.id === item.id ? { ...entry, quantity: Math.max(1, entry.quantity) } : entry,
  );
  const before = matchDrinksToAdega(drinks, allItems);
  const after = matchDrinksToAdega(drinks, simulated);

  const drinkTitles: string[] = [];
  for (const drink of drinks) {
    const prev = before.get(drink.slug);
    const next = after.get(drink.slug);
    if (prev?.status !== 'ready' && next?.status === 'ready') {
      drinkTitles.push(drink.title);
    }
  }

  return {
    item,
    drinksReady: drinkTitles.length,
    drinkTitles: drinkTitles.sort((a, b) => a.localeCompare(b, 'pt-BR')),
  };
}

export function getAdegaItemDrinkUses(item: AdegaItem, drinks: ViniciusDrink[]): ViniciusDrink[] {
  return getDrinksForAdegaItem(item, drinks);
}
