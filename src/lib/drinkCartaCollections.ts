import { filterDrinksByAdega } from './drinkAdegaMatch';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

export type DrinkCollectionId =
  | 'essenciais'
  | 'festa'
  | 'verao'
  | 'after-dinner'
  | 'adega-hoje';

export type DrinkCollection = {
  id: DrinkCollectionId;
  label: string;
  emoji: string;
  description: string;
  slugs?: string[];
  dynamic?: boolean;
};

export const DRINK_COLLECTIONS: DrinkCollection[] = [
  {
    id: 'essenciais',
    label: 'Essenciais',
    emoji: '🌟',
    description: 'Clássicos para começar o bar em casa.',
    slugs: [
      'daiquiri',
      'whisky-sour',
      'mojito',
      'margarita',
      'negroni',
      'dry-martini',
      'caipitudo',
      'moscow-mule',
    ],
  },
  {
    id: 'festa',
    label: 'Para festa',
    emoji: '🎉',
    description: 'Fáceis de repetir com convidados.',
    slugs: [
      'caipitudo',
      'caipiroska-de-limao',
      'caipiroska-de-maracuja',
      'mojito',
      'moscow-mule',
      'cuba-libre',
      'blue-lagoon',
      'margarita-blue',
      'whisky-cola',
    ],
  },
  {
    id: 'verao',
    label: 'Verão',
    emoji: '☀️',
    description: 'Refrescantes e leves.',
    slugs: [
      'mojito',
      'caipitudo',
      'caipiroska-de-limao',
      'caipiroska-de-maracuja',
      'moscow-mule',
      'blue-lagoon',
      'margarita',
      'daiquiri',
    ],
  },
  {
    id: 'after-dinner',
    label: 'After dinner',
    emoji: '🌙',
    description: 'Mais encorpados ou amargos.',
    slugs: ['negroni', 'dry-martini', 'vesper-martini', 'whisky-sour', 'bloody-mary'],
  },
  {
    id: 'adega-hoje',
    label: 'Com sua adega',
    emoji: '🍸',
    description: 'Prontos com o que você tem agora.',
    dynamic: true,
  },
];

const COLLECTION_SLUGS = new Map(
  DRINK_COLLECTIONS.filter((c) => c.slugs).map((c) => [c.id, new Set(c.slugs)]),
);

export function filterDrinksByCollection(
  drinks: ViniciusDrink[],
  collectionId: DrinkCollectionId | null,
  adegaItems?: AdegaItem[],
): ViniciusDrink[] {
  if (!collectionId) return drinks;

  if (collectionId === 'adega-hoje') {
    if (!adegaItems?.length) return [];
    return filterDrinksByAdega(drinks, adegaItems, 'ready');
  }

  const slugs = COLLECTION_SLUGS.get(collectionId);
  if (!slugs) return drinks;
  return drinks.filter((drink) => slugs.has(drink.slug));
}

export function getCollectionById(id: DrinkCollectionId): DrinkCollection | undefined {
  return DRINK_COLLECTIONS.find((c) => c.id === id);
}
