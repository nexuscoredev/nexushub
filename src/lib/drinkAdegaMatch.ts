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
    id: 'lillet',
    label: 'Lillet',
    categories: ['Vinho', 'Licor'],
    patterns: [/lillet/i],
  },
  {
    id: 'vermouth',
    label: 'Vermute',
    categories: ['Vinho', 'Licor'],
    patterns: [/vermouth|vermute/i],
  },
  {
    id: 'licor',
    label: 'Licor',
    categories: ['Licor'],
    patterns: [/cointreau|triple sec|cura[cç]au|curacao|licor|bitter|campari|aperol/i],
  },
];

export type SpiritVariant = 'dry' | 'sweet' | 'lillet' | 'bianco';

export type DrinkRequirementGroup = {
  label: string;
  ruleIds: string[];
  searchTerms: string[];
  /** Variante específica pedida na receita (ex.: Extra Dry ≠ Lillet). */
  variant?: SpiritVariant;
};

export type DrinkAdegaMatchStatus = 'ready' | 'partial' | 'missing';

export type DrinkAdegaMatch = {
  slug: string;
  status: DrinkAdegaMatchStatus;
  groups: DrinkRequirementGroup[];
  missingLabels: string[];
  matches: { groupLabel: string; itemName: string; itemId: string }[];
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Split "Gin/Vodka" alternatives without breaking fractions like "1/2". */
function splitSlashAlternatives(text: string): string[] {
  const parts: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '/' && i > 0 && i < text.length - 1) {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (/\d/.test(prev) && /\d/.test(next)) {
        current += char;
        continue;
      }
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts.length > 0 ? parts : [text];
}

function findRulesForToken(token: string): SpiritRule[] {
  const normalized = normalizeText(token);
  return SPIRIT_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(normalized)),
  );
}

function findRulesForIngredient(ingredient: string): SpiritRule[] {
  const slashOptions = splitSlashAlternatives(ingredient)
    .map((part) => part.replace(/.*\bde\b\s+/i, '').trim())
    .filter(Boolean);

  if (slashOptions.length > 1) {
    const rules = slashOptions.flatMap((option) => findRulesForToken(option));
    return [...new Map(rules.map((rule) => [rule.id, rule])).values()];
  }

  const normalized = normalizeText(ingredient);
  return SPIRIT_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(normalized)));
}

function extractSpiritVariant(ingredient: string): SpiritVariant | undefined {
  const normalized = normalizeText(ingredient);
  if (/lillet/.test(normalized)) return 'lillet';
  if (/extra\s*dry|extraseco|vermouth\s*dry|vermute\s*seco|\bdry\s*vermouth/.test(normalized)) {
    return 'dry';
  }
  if (/rosso|sweet|vermelho|rouge|dulce|vermute\s*doce|vermouth\s*sweet/.test(normalized)) {
    return 'sweet';
  }
  if (/\bbianco\b|\bblanc\b/.test(normalized) && !/lillet/.test(normalized)) return 'bianco';
  return undefined;
}

function pickPrimaryRule(ingredient: string, rules: SpiritRule[]): SpiritRule {
  const variant = extractSpiritVariant(ingredient);
  if (variant === 'lillet') {
    const lillet = rules.find((rule) => rule.id === 'lillet');
    if (lillet) return lillet;
  }

  const order = SPIRIT_RULES.map((rule) => rule.id);
  return [...rules].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))[0];
}

function itemMatchesSpiritVariant(haystack: string, variant: SpiritVariant): boolean {
  const normalized = normalizeText(haystack);

  switch (variant) {
    case 'lillet':
      return /lillet/.test(normalized);
    case 'dry':
      if (/lillet|rosso|sweet|vermelho|rouge|dulce|antica\s*formula|\bbianco\b/.test(normalized)) {
        return false;
      }
      return (
        /extra\s*dry|extraseco|\bdry\b|seco|noilly|dolin\s*dry|martini\s*extra\s*dry/.test(normalized) ||
        (/vermouth|vermute/.test(normalized) &&
          !/lillet|rosso|sweet|vermelho|rouge|bianco|blanc/.test(normalized))
      );
    case 'sweet':
      if (/lillet|extra\s*dry|extraseco|\bdry\b/.test(normalized)) return false;
      return /rosso|sweet|vermelho|rouge|dulce|carpano|antica\s*formula/.test(normalized);
    case 'bianco':
      return /\bbianco\b|\bblanc\b/.test(normalized) && !/lillet/.test(normalized);
    default:
      return true;
  }
}

function ingredientDisplayLabel(ingredient: string): string {
  let text = ingredient.trim();
  text = text.replace(/\([^)]*\)/g, '').trim();
  text = text.replace(/[;,.\s]+$/, '');

  if (text.includes('/')) {
    const parts = splitSlashAlternatives(text)
      .map((part) => part.replace(/.*\bde\b\s+/i, '').trim())
      .filter(Boolean);
    text = parts[0] ?? text;
  }

  text = text
    // "60ml de", "1 dose de" — unidade obrigatória (evita cortar só o número em "60ml")
    .replace(
      /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(?:ml|cl|doses?|colher(?:es)?|gotas?|pitadas?|lata(?:s)?|garrafa(?:s)?|un\.?|g|kg|l)\s*(?:de\s+)?/i,
      '',
    )
    .replace(/^(?:suco de\s+)?(\d+\/\d+\s+|\d+\s+ou\s+\d+\/?\s*)/i, '')
    // número solto com espaço: "1 Limão", "1/2 dose de"
    .replace(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s+(?:doses?\s+)?(?:de\s+)?/i, '')
    .replace(/^(?:uma|um)\s+(?:fatia|lata|garrafa)\s+(?:de\s+)?/i, '')
    .replace(/^de\s+/i, '')
    .replace(/\s+ou\s+(?:\d+(?:\/\d+)?|meio(?:\s+\w+)?)\s*$/i, '')
    .trim();

  if (!text) return ingredient.trim().slice(0, 48);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSearchTerms(ingredient: string, label: string): string[] {
  const terms = new Set<string>();
  const add = (value: string) => {
    const normalized = normalizeText(value.trim());
    if (normalized.length >= 2) terms.add(normalized);
  };

  add(label);
  for (const word of label.split(/\s+/)) {
    if (word.length >= 3) add(word);
  }

  const deMatch = ingredient.match(/\bde\s+(.+?)(?:[;,.\s(]|$)/i);
  if (deMatch) add(deMatch[1]);

  for (const token of splitSlashAlternatives(ingredient).concat(ingredient.split(/[,;]/))) {
    const cleaned = token.replace(/.*\bde\b\s+/i, '').trim();
    if (cleaned.length >= 3) add(cleaned);
  }

  return [...terms];
}

function haystackIncludesTerm(haystack: string, term: string): boolean {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}

function requirementKey(group: DrinkRequirementGroup): string {
  if (group.ruleIds.length) return group.ruleIds.slice().sort().join('|');
  return normalizeText(group.label);
}

export function extractDrinkRequirementGroups(drink: ViniciusDrink): DrinkRequirementGroup[] {
  const groups: DrinkRequirementGroup[] = [];
  const seen = new Set<string>();

  for (const ingredient of drink.ingredients) {
    if (isFixedIngredient(ingredient)) continue;

    const rules = findRulesForIngredient(ingredient);
    const slashOptions = splitSlashAlternatives(ingredient).filter((part) => part.trim().length > 0);
    const isOrGroup = slashOptions.length > 1 && rules.length > 1;

    if (rules.length) {
      const primaryRule = pickPrimaryRule(ingredient, rules);
      const displayLabel = ingredientDisplayLabel(ingredient);
      const variant = extractSpiritVariant(ingredient);
      const group: DrinkRequirementGroup = isOrGroup
        ? {
            label: rules.map((rule) => rule.label).join(' ou '),
            ruleIds: rules.map((rule) => rule.id),
            searchTerms: buildSearchTerms(ingredient, rules.map((rule) => rule.label).join(' ')),
          }
        : {
            label:
              variant || displayLabel.length > primaryRule.label.length
                ? displayLabel
                : primaryRule.label,
            ruleIds: [primaryRule.id],
            searchTerms: buildSearchTerms(ingredient, displayLabel),
            variant,
          };

      const key = requirementKey(group);
      if (!seen.has(key)) {
        seen.add(key);
        groups.push(group);
      }
      continue;
    }

    const label = ingredientDisplayLabel(ingredient);
    const group: DrinkRequirementGroup = {
      label,
      ruleIds: [],
      searchTerms: buildSearchTerms(ingredient, label),
    };
    const key = requirementKey(group);
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push(group);
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

  if (rule.id === 'licor' || rule.id === 'vermouth' || rule.id === 'lillet') {
    return patternMatch || (categoryMatch && rule.patterns.some((pattern) => pattern.test(haystack)));
  }

  if (categoryMatch) return true;
  return patternMatch;
}

function itemMatchesGroup(item: AdegaItem, group: DrinkRequirementGroup): boolean {
  if (item.quantity <= 0) return false;

  const haystack = itemHaystack(item);

  if (group.variant && !itemMatchesSpiritVariant(haystack, group.variant)) {
    return false;
  }

  for (const ruleId of group.ruleIds) {
    const rule = SPIRIT_RULES.find((entry) => entry.id === ruleId);
    if (rule && itemMatchesRule(item, rule)) return true;
  }

  return group.searchTerms.some((term) => haystackIncludesTerm(haystack, term));
}

function findItemForGroup(items: AdegaItem[], group: DrinkRequirementGroup): AdegaItem | null {
  return items.find((item) => itemMatchesGroup(item, group)) ?? null;
}

/** Itens na adega da mesma família, mas que não satisfazem a variante exata pedida na receita. */
export function findSubstituteItemsForGroup(
  group: DrinkRequirementGroup,
  adegaItems: AdegaItem[],
  excludeItemIds: Set<string> = new Set(),
): AdegaItem[] {
  if (!group.ruleIds.length) return [];

  return adegaItems.filter((item) => {
    if (item.quantity <= 0 || excludeItemIds.has(item.id)) return false;
    if (itemMatchesGroup(item, group)) return false;

    const haystack = itemHaystack(item);
    const matchesRule = group.ruleIds.some((ruleId) => {
      const rule = SPIRIT_RULES.find((entry) => entry.id === ruleId);
      return rule ? itemMatchesRule(item, rule) : false;
    });

    if (!matchesRule) return false;
    if (group.variant) return !itemMatchesSpiritVariant(haystack, group.variant);
    return true;
  });
}

export function matchDrinkToAdega(drink: ViniciusDrink, adegaItems: AdegaItem[]): DrinkAdegaMatch {
  const available = adegaItems.filter((item) => item.quantity > 0);
  const groups = extractDrinkRequirementGroups(drink);
  const matches: DrinkAdegaMatch['matches'] = [];
  const missingLabels: string[] = [];

  for (const group of groups) {
    const hit = findItemForGroup(available, group);
    if (hit) {
      matches.push({ groupLabel: group.label, itemName: hit.name, itemId: hit.id });
    } else {
      missingLabels.push(group.label);
    }
  }

  let status: DrinkAdegaMatchStatus = 'missing';
  if (groups.length === 0) {
    status = 'ready';
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
  mode: 'ready' | 'partial' | 'almost' | 'all',
): ViniciusDrink[] {
  if (mode === 'all') return drinks;

  const matches = matchDrinksToAdega(drinks, adegaItems);
  return drinks.filter((drink) => {
    const match = matches.get(drink.slug);
    if (!match) return false;
    if (mode === 'ready') return match.status === 'ready';
    if (mode === 'almost') {
      return (
        match.status === 'partial' &&
        match.missingLabels.length > 0 &&
        match.missingLabels.length <= 2
      );
    }
    return match.status === 'ready' || match.status === 'partial';
  });
}

export function adegaItemUsedInDrink(item: AdegaItem, drink: ViniciusDrink): boolean {
  const groups = extractDrinkRequirementGroups(drink);
  return groups.some((group) => itemMatchesGroup(item, group));
}

export function getDrinksForAdegaItem(
  item: AdegaItem,
  drinks: ViniciusDrink[],
): ViniciusDrink[] {
  return drinks.filter((drink) => adegaItemUsedInDrink(item, drink));
}

export function countDrinksForAdegaItem(item: AdegaItem, drinks: ViniciusDrink[]): number {
  return getDrinksForAdegaItem(item, drinks).length;
}

export type ShoppingListEntry = {
  label: string;
  count: number;
  drinks: string[];
};

export function aggregateShoppingList(
  drinks: ViniciusDrink[],
  adegaItems: AdegaItem[],
): ShoppingListEntry[] {
  const almost = filterDrinksByAdega(drinks, adegaItems, 'almost');
  const matches = matchDrinksToAdega(almost, adegaItems);
  const map = new Map<string, { label: string; count: number; drinks: Set<string> }>();

  for (const drink of almost) {
    const match = matches.get(drink.slug);
    if (!match) continue;
    for (const label of match.missingLabels) {
      const key = normalizeText(label);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.drinks.add(drink.title);
      } else {
        map.set(key, { label, count: 1, drinks: new Set([drink.title]) });
      }
    }
  }

  return [...map.values()]
    .map((entry) => ({
      label: entry.label,
      count: entry.count,
      drinks: [...entry.drinks].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
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

export function formatMissingIngredients(match: DrinkAdegaMatch): string {
  if (match.missingLabels.length === 0) return '';
  if (match.missingLabels.length === 1) return match.missingLabels[0];
  return match.missingLabels.join(', ');
}
