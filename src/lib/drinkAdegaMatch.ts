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
    patterns: [/cointreau|triple sec|cura[cç]au|curacao|licor|bitter|campari|aperol/i],
  },
];

export type DrinkRequirementGroup = {
  label: string;
  ruleIds: string[];
  searchTerms: string[];
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
    .replace(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*/i, '')
    .replace(/^(?:suco de\s+)?(\d+\/\d+\s+|\d+\s+ou\s+\d+\/?\s*)/i, '')
    .replace(
      /^(\d+(?:[.,]\d+)?)\s*(?:ml|cl|doses?|colher(?:es)?|gotas?|pitadas?|lata|garrafa|un\.?|g|kg|l)?\s*(?:de\s+)?/i,
      '',
    )
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
      const group: DrinkRequirementGroup = isOrGroup
        ? {
            label: rules.map((rule) => rule.label).join(' ou '),
            ruleIds: rules.map((rule) => rule.id),
            searchTerms: buildSearchTerms(ingredient, rules.map((rule) => rule.label).join(' ')),
          }
        : {
            label: rules[0].label,
            ruleIds: [rules[0].id],
            searchTerms: buildSearchTerms(ingredient, rules[0].label),
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

  if (rule.id === 'licor' || rule.id === 'vermouth') {
    return patternMatch || (categoryMatch && rule.patterns.some((pattern) => pattern.test(haystack)));
  }

  if (categoryMatch) return true;
  return patternMatch;
}

function itemMatchesGroup(item: AdegaItem, group: DrinkRequirementGroup): boolean {
  if (item.quantity <= 0) return false;

  for (const ruleId of group.ruleIds) {
    const rule = SPIRIT_RULES.find((entry) => entry.id === ruleId);
    if (rule && itemMatchesRule(item, rule)) return true;
  }

  const haystack = itemHaystack(item);
  return group.searchTerms.some((term) => haystack.includes(term));
}

function findItemForGroup(items: AdegaItem[], group: DrinkRequirementGroup): AdegaItem | null {
  return items.find((item) => itemMatchesGroup(item, group)) ?? null;
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

export function formatMissingIngredients(match: DrinkAdegaMatch): string {
  if (match.missingLabels.length === 0) return '';
  if (match.missingLabels.length === 1) return match.missingLabels[0];
  return match.missingLabels.join(', ');
}
