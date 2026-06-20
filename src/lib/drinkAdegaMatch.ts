import { isFixedIngredient } from './drinkRecipeScale';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

type SpiritRule = {
  id: string;
  label: string;
  categories: string[];
  patterns: RegExp[];
};

const SPIRIT_RULES: SpiritRule[] = [
  { id: 'whisky', label: 'Whisky', categories: ['Whisky'], patterns: [/whisky|u[ií]sque/i] },
  { id: 'vodka', label: 'Vodka', categories: ['Vodka'], patterns: [/vodka/i] },
  { id: 'gin', label: 'Gin', categories: ['Gin'], patterns: [/\bgin\b/i] },
  { id: 'rum', label: 'Rum', categories: ['Rum'], patterns: [/rum/i] },
  { id: 'tequila', label: 'Tequila', categories: ['Tequila'], patterns: [/tequila/i] },
  { id: 'cachaca', label: 'Cachaça', categories: ['Cachaça'], patterns: [/cacha[cç]a/i] },
  { id: 'sake', label: 'Saquê', categories: ['Outro'], patterns: [/saqu[eê]/i] },
  { id: 'cerveja', label: 'Cerveja', categories: ['Cerveja'], patterns: [/cerveja|pilsen/i] },
  {
    id: 'vermouth',
    label: 'Vermute',
    categories: ['Vinho', 'Licor'],
    patterns: [/vermouth|vermute|lillet/i],
  },
  {
    id: 'licor',
    label: 'Licor',
    categories: ['Licor'],
    patterns: [/cointreau|triple sec|cura[cç]au|curacao|licor/i],
  },
];

const PANTRY_RE =
  /coca[\s-]?cola|refrigerante|ginger beer|\bsoda\b|suco de tomate|molho ingl|tabasco|suco de limão|simplesmente|polpa|talos?|virada para cima|macere|açúcar|acucar|xarope|fruta|maracuj|colher|pitada|dash|gotas?|fatia de lim|lim[aã]o|limões|limoes|gelo|^sal\b|decor|casquinha|rodela|azeitona|complete com|despeje|misture|bata|agite|coe|gela|caneca|taça|coqueteleira|preferencialmente|escolha|gosto|aproximadamente/i;

export type DrinkRequirementGroup = {
  label: string;
  ruleIds: string[];
};

export type DrinkAdegaMatchStatus = 'ready' | 'partial' | 'missing';

export type DrinkAdegaMatch = {
  slug: string;
  status: DrinkAdegaMatchStatus;
  groups: DrinkRequirementGroup[];
  missingLabels: string[];
  matches: { groupLabel: string; itemName: string }[];
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function isPantryIngredient(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (isFixedIngredient(trimmed)) return true;
  return PANTRY_RE.test(trimmed);
}

function findRulesForToken(token: string): SpiritRule[] {
  const normalized = normalizeText(token);
  return SPIRIT_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(normalized)),
  );
}

function findRulesForIngredient(ingredient: string): SpiritRule[] {
  const slashOptions = ingredient
    .split('/')
    .map((part) => part.replace(/.*\bde\b\s+/i, '').trim())
    .filter(Boolean);

  if (slashOptions.length > 1) {
    const rules = slashOptions.flatMap((option) => findRulesForToken(option));
    return [...new Map(rules.map((rule) => [rule.id, rule])).values()];
  }

  const normalized = normalizeText(ingredient);
  return SPIRIT_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(normalized)));
}

export function extractDrinkRequirementGroups(drink: ViniciusDrink): DrinkRequirementGroup[] {
  const groups: DrinkRequirementGroup[] = [];

  for (const ingredient of drink.ingredients) {
    if (isPantryIngredient(ingredient)) continue;

    const rules = findRulesForIngredient(ingredient);
    if (!rules.length) continue;

    const slashOptions = ingredient.split('/').filter((part) => part.trim().length > 0);
    const isOrGroup = slashOptions.length > 1 && rules.length > 1;

    if (isOrGroup) {
      groups.push({
        label: rules.map((rule) => rule.label).join(' ou '),
        ruleIds: rules.map((rule) => rule.id),
      });
      continue;
    }

    for (const rule of rules) {
      if (!groups.some((group) => group.ruleIds.includes(rule.id))) {
        groups.push({ label: rule.label, ruleIds: [rule.id] });
      }
    }
  }

  return groups;
}

function itemHaystack(item: AdegaItem): string {
  return normalizeText(`${item.name} ${item.brand ?? ''} ${item.category}`);
}

function itemMatchesRule(item: AdegaItem, rule: SpiritRule): boolean {
  if (item.quantity <= 0) return false;

  const haystack = itemHaystack(item);
  const categoryMatch = rule.categories.some(
    (category) => normalizeText(item.category) === normalizeText(category),
  );

  const patternMatch = rule.patterns.some((pattern) => pattern.test(haystack));

  if (rule.id === 'sake') {
    return patternMatch;
  }

  if (rule.id === 'licor' || rule.id === 'vermouth') {
    return patternMatch || (categoryMatch && rule.patterns.some((pattern) => pattern.test(haystack)));
  }

  if (categoryMatch) return true;
  return patternMatch;
}

function findItemForGroup(items: AdegaItem[], group: DrinkRequirementGroup): AdegaItem | null {
  for (const ruleId of group.ruleIds) {
    const rule = SPIRIT_RULES.find((entry) => entry.id === ruleId);
    if (!rule) continue;
    const hit = items.find((item) => itemMatchesRule(item, rule));
    if (hit) return hit;
  }
  return null;
}

export function matchDrinkToAdega(drink: ViniciusDrink, adegaItems: AdegaItem[]): DrinkAdegaMatch {
  const available = adegaItems.filter((item) => item.quantity > 0);
  const groups = extractDrinkRequirementGroups(drink);
  const matches: DrinkAdegaMatch['matches'] = [];
  const missingLabels: string[] = [];

  for (const group of groups) {
    const hit = findItemForGroup(available, group);
    if (hit) {
      matches.push({ groupLabel: group.label, itemName: hit.name });
    } else {
      missingLabels.push(group.label);
    }
  }

  let status: DrinkAdegaMatchStatus = 'missing';
  if (groups.length === 0) {
    status = 'partial';
  } else if (missingLabels.length === 0) {
    status = 'ready';
  } else if (matches.length > 0) {
    status = 'partial';
  }

  return {
    slug: drink.slug,
    status,
    groups,
    missingLabels,
    matches,
  };
}

export function matchDrinksToAdega(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
): Map<string, DrinkAdegaMatch> {
  return new Map(drinks.map((drink) => [drink.slug, matchDrinkToAdega(drink, adegaItems)]));
}

export function filterDrinksByAdega(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
  mode: 'ready' | 'partial' | 'all',
): ViniciusDrink[] {
  if (mode === 'all') return drinks;

  const matches = matchDrinksToAdega(drinks, adegaItems);
  return drinks.filter((drink) => {
    const match = matches.get(drink.slug);
    if (!match) return false;
    if (mode === 'ready') return match.status === 'ready';
    return match.status === 'ready' || match.status === 'partial';
  });
}

export type DrinkSuggestion = {
  drink: ViniciusDrink;
  match: DrinkAdegaMatch;
};

export function getDrinkSuggestions(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
): { ready: DrinkSuggestion[]; almost: DrinkSuggestion[] } {
  const matches = matchDrinksToAdega(drinks, adegaItems);
  const ready: DrinkSuggestion[] = [];
  const almost: DrinkSuggestion[] = [];

  for (const drink of drinks) {
    const match = matches.get(drink.slug);
    if (!match) continue;
    if (match.status === 'ready') ready.push({ drink, match });
    else if (match.status === 'partial') almost.push({ drink, match });
  }

  almost.sort(
    (a, b) =>
      a.match.missingLabels.length - b.match.missingLabels.length ||
      a.drink.title.localeCompare(b.drink.title, 'pt-BR'),
  );

  ready.sort((a, b) => a.drink.title.localeCompare(b.drink.title, 'pt-BR'));

  return { ready, almost };
}
