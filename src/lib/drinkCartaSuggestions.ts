import { matchDrinkToAdega, type DrinkAdegaMatch } from './drinkAdegaMatch';
import {
  drinkThumbPath,
  isCatalogDrinkSlug,
  type ViniciusDrink,
} from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

/** Thumb por slug — mesmo padrão da carta (`/thumbs/{slug}.jpg`). */
export function suggestionDrinkThumbPath(slug: string): string {
  return drinkThumbPath(slug);
}

function suggestionDrink(entry: Omit<ViniciusDrink, 'imageUrl'>): ViniciusDrink {
  return { ...entry, imageUrl: drinkThumbPath(entry.slug) };
}

/** Receitas clássicas que ainda não estão na carta padrão. */
export const DRINK_SUGGESTION_CATALOG: ViniciusDrink[] = [
  suggestionDrink({
    slug: 'caipirinha',
    title: 'Caipirinha',
    tagline: 'Cachaça, limão e açúcar — o clássico brasileiro batido na mão.',
    ingredients: ['1 limão cortado em pedaços', '2 colheres de açúcar', '60ml de Cachaça', 'Gelo'],
    steps: [
      'Macere o limão com o açúcar no copo;',
      'Acrescente a cachaça e o gelo;',
      'Misture bem e sirva.',
    ],
    notes: 'Drink misturado (não batido na coqueteleira)!',
  }),
  suggestionDrink({
    slug: 'gin-tonic',
    title: 'Gin Tonic',
    tagline: 'Gin, tônica e limão — seco, refrescante e direto ao ponto.',
    ingredients: ['50ml de Gin', '150ml de Refrigerante tônica', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente o gin;',
      'Complete com tônica;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'old-fashioned',
    title: 'Old Fashioned',
    tagline: 'Whisky, açúcar e bitter — clássico americano na rocha.',
    ingredients: [
      '60ml de Whisky',
      '1 colher de açúcar ou 1/2 dose de xarope de açúcar',
      '2 dashes de bitter',
      'Gelo',
    ],
    steps: [
      'Dissolva o açúcar com o bitter no copo;',
      'Acrescente o whisky e o gelo;',
      'Mexa delicadamente e sirva.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'manhattan',
    title: 'Manhattan',
    tagline: 'Whisky e vermute rosso — elegante e aromático.',
    ingredients: ['50ml de Whisky', '25ml de Vermute Rosso', 'Gelo'],
    steps: [
      'Misture whisky e vermute com gelo;',
      'Coe para taça gelada;',
      'Decore com casca de limão ou cereja.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'rum-cola',
    title: 'Rum Cola',
    tagline: 'Rum, cola e limão — simples e sempre funciona.',
    ingredients: ['50ml de Rum', '150ml de Coca Cola', 'Gelo', 'Suco de 1/2 limão'],
    steps: [
      'Gele o copo;',
      'Acrescente rum e limão;',
      'Complete com cola;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'tequila-sunrise',
    title: 'Tequila Sunrise',
    tagline: 'Tequila, suco de laranja e grenadine — visual de pôr do sol.',
    ingredients: [
      '50ml de Tequila',
      '120ml de Suco de laranja',
      '15ml de Grenadine ou xarope de frutas vermelhas',
      'Gelo',
    ],
    steps: [
      'Gele o copo com tequila, gelo e suco de laranja;',
      'Despeje a grenadine devagar pela borda;',
      'Sirva sem misturar demais.',
    ],
    notes: 'Drink montado (não batido)!',
  }),
  suggestionDrink({
    slug: 'gin-fizz',
    title: 'Gin Fizz',
    tagline: 'Gin, limão, xarope e soda — leve e cítrico.',
    ingredients: [
      '50ml de Gin',
      'Suco de 1 limão',
      '1/2 dose de xarope de açúcar',
      'Soda ou água com gás',
      'Gelo',
    ],
    steps: [
      'Misture gin, limão e xarope com gelo;',
      'Complete com soda;',
      'Sirva imediatamente.',
    ],
    notes: 'Drink batido ou misturado!',
  }),
  suggestionDrink({
    slug: 'whiskey-smash',
    title: 'Whiskey Smash',
    tagline: 'Whisky, limão e hortelã — aromático e refrescante.',
    ingredients: [
      '60ml de Whisky',
      '1/2 limão cortado',
      '5 folhas de Hortelã',
      '1/2 dose de xarope de açúcar',
      'Gelo',
    ],
    steps: [
      'Macere limão, hortelã e xarope no copo;',
      'Acrescente whisky e gelo;',
      'Misture e sirva.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'paloma',
    title: 'Paloma',
    tagline: 'Tequila, grapefruit soda e limão — mexicano e cítrico.',
    ingredients: [
      '50ml de Tequila',
      '150ml de Refrigerante de grapefruit ou soda cítrica',
      'Suco de 1/2 limão',
      'Sal a gosto',
      'Gelo',
    ],
    steps: [
      'Gele o copo com sal na borda se quiser;',
      'Acrescente tequila e limão;',
      'Complete com soda de grapefruit;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'tom-collins',
    title: 'Tom Collins',
    tagline: 'Gin, limão, xarope e soda — alto, gelado e clássico.',
    ingredients: [
      '50ml de Gin',
      'Suco de 1 limão',
      '1/2 dose de xarope de açúcar',
      'Soda',
      'Gelo',
    ],
    steps: [
      'Misture gin, limão e xarope com gelo;',
      'Complete com soda em copo alto;',
      'Decore com limão e cereja.',
    ],
    notes: 'Drink misturado (não batido)!',
  }),
  suggestionDrink({
    slug: 'aperol-spritz',
    title: 'Aperol Spritz',
    tagline: 'Aperol, espumante e soda — leve e laranja.',
    ingredients: [
      '60ml de Aperol ou bitter de laranja',
      '90ml de Vinho espumante',
      '30ml de Soda',
      'Gelo',
      '1 rodela de laranja',
    ],
    steps: [
      'Gele a taça de vinho;',
      'Acrescente Aperol, espumante e soda;',
      'Misture suavemente e decore com laranja.',
    ],
    notes: 'Drink montado (não batido)!',
  }),
  suggestionDrink({
    slug: 'french-75',
    title: 'French 75',
    tagline: 'Gin, limão, xarope e espumante — festivo e elegante.',
    ingredients: [
      '30ml de Gin',
      '15ml de Suco de limão',
      '1/2 dose de xarope de açúcar',
      '90ml de Vinho espumante',
    ],
    steps: [
      'Misture gin, limão e xarope com gelo;',
      'Coe para taça de espumante;',
      'Complete com espumante.',
    ],
    notes: 'Drink batido e depois completado com espumante!',
  }),
  suggestionDrink({
    slug: 'pisco-sour',
    title: 'Pisco Sour',
    tagline: 'Pisco, limão e açúcar — clássico chileno batido e cremoso.',
    ingredients: ['50ml de Pisco', 'Suco de 1 limão', '2 colheres de açúcar', 'Gelo'],
    steps: [
      'Bata pisco, limão, açúcar e gelo na coqueteleira;',
      'Coe para taça ou copo;',
      'Opcional: uma gota de bitter na espuma.',
    ],
    notes: 'Drink batido!',
    category: 'Pisco',
  }),
  suggestionDrink({
    slug: 'gin-tonica-rose',
    title: 'Gin Tônica Rosé',
    tagline: 'Gin com Schweppes Tônica Rosé — floral e refrescante.',
    ingredients: ['50ml de Gin', '150ml de Schweppes Tônica Rosé', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente o gin;',
      'Complete com tônica rosé;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Gin',
  }),
  suggestionDrink({
    slug: 'vodka-tonica',
    title: 'Vodka Tônica',
    tagline: 'Vodka, água tônica e limão — seco e direto.',
    ingredients: ['50ml de Vodka', '150ml de Água Tônica', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente a vodka;',
      'Complete com tônica;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Vodka',
  }),
  suggestionDrink({
    slug: 'ballena-cola',
    title: 'Batanga',
    tagline: 'Ballena, Coca-Cola e limão — clássico mexicano no copo alto.',
    ingredients: ['50ml de Tequila', '1 Coca-Cola', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele o copo;',
      'Acrescente a Ballena e o limão;',
      'Complete com Coca-Cola;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Tequila',
  }),
  suggestionDrink({
    slug: 'ballena-mule',
    title: 'Ballena Mule',
    tagline: 'Tequila Ballena, ginger ale e limão — mule mexicano.',
    ingredients: ['50ml de Tequila', 'Schweppes Ginger Ale', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele o copo ou caneca;',
      'Acrescente a Ballena e o limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Tequila',
  }),
  suggestionDrink({
    slug: 'ballena-tonica',
    title: 'Ballena Tônica',
    tagline: 'Ballena, água tônica e limão — seco e cítrico.',
    ingredients: ['50ml de Tequila', '150ml de Água Tônica', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente a Ballena;',
      'Complete com tônica;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Tequila',
  }),
  suggestionDrink({
    slug: 'ballena-tonica-rose',
    title: 'Ballena Tônica Rosé',
    tagline: 'Ballena com Schweppes Tônica Rosé — floral e refrescante.',
    ingredients: ['50ml de Tequila', '150ml de Schweppes Tônica Rosé', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente a Ballena;',
      'Complete com tônica rosé;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Tequila',
  }),
  suggestionDrink({
    slug: 'ballena-sour',
    title: 'Ballena Sour',
    tagline: 'Ballena, limão e açúcar — sour simples e equilibrado.',
    ingredients: ['50ml de Tequila', 'Suco de 1 limão', '2 colheres de açúcar', 'Gelo'],
    steps: [
      'Bata Ballena, limão, açúcar e gelo na coqueteleira;',
      'Coe para taça ou copo;',
      'Sirva gelado.',
    ],
    notes: 'Drink batido!',
    category: 'Tequila',
  }),
  suggestionDrink({
    slug: 'jack-ginger',
    title: 'Jack Ginger',
    tagline: "Whisky Jack Daniel's, ginger ale e limão.",
    ingredients: ['50ml de Whisky', 'Schweppes Ginger Ale', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele o copo;',
      'Acrescente whisky e limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Whisky',
  }),
  suggestionDrink({
    slug: 'jack-honey-ginger',
    title: 'Honey Ginger',
    tagline: 'Tennessee Honey, ginger ale e limão — doce e especiado.',
    ingredients: [
      "50ml de Jack Daniel's Tennessee Honey",
      'Schweppes Ginger Ale',
      'Suco de 1/2 limão',
      'Gelo',
    ],
    steps: [
      'Gele o copo;',
      'Acrescente o licor e o limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Licor',
  }),
  suggestionDrink({
    slug: 'bacardi-apple-mule',
    title: 'Apple Mule',
    tagline: 'Bacardi Big Apple, ginger ale e limão — mule com maçã.',
    ingredients: ['50ml de Rum', 'Schweppes Ginger Ale', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele o copo ou caneca;',
      'Acrescente rum e limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Rum',
  }),
  suggestionDrink({
    slug: 'lillet-spritz',
    title: 'Lillet Spritz',
    tagline: 'Lillet Blanc, tônica e limão — leve e aromático.',
    ingredients: ['60ml de Vermouth Lillet', '90ml de Água Tônica', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele a taça de vinho;',
      'Acrescente Lillet e tônica;',
      'Misture suavemente e decore com limão.',
    ],
    notes: 'Drink montado (não batido)!',
    category: 'Aperitivo',
  }),
  suggestionDrink({
    slug: 'martini-bianco',
    title: 'Martini Bianco',
    tagline: 'Gin e vermute bianco — suave e aromático.',
    ingredients: ['60ml de Gin', '20ml de Vermute Bianco', 'Gelo'],
    steps: [
      'Misture gin e vermute com gelo;',
      'Coe para taça martini gelada;',
      'Finalize com casca de limão.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Gin',
  }),
  suggestionDrink({
    slug: 'pisco-ginger',
    title: 'Chilcano',
    tagline: 'Pisco, ginger ale e limão — refrescante e leve.',
    ingredients: ['50ml de Pisco', 'Schweppes Ginger Ale', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele o copo alto;',
      'Acrescente pisco e limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Pisco',
  }),
  suggestionDrink({
    slug: 'sake-ginger',
    title: 'Sake Ginger',
    tagline: 'Saquê e ginger ale — highball leve e seco.',
    ingredients: ['60ml de Saquê', 'Schweppes Ginger Ale', 'Gelo'],
    steps: [
      'Gele o copo alto;',
      'Acrescente o saquê;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Saquê',
  }),
  suggestionDrink({
    slug: 'royal-mule',
    title: 'Royal Mule',
    tagline: 'Royal Salute, ginger ale e limão — mule premium.',
    ingredients: ['50ml de Whisky', 'Schweppes Ginger Ale', 'Suco de 1/2 limão', 'Gelo'],
    steps: [
      'Gele a caneca ou copo;',
      'Acrescente whisky e limão;',
      'Complete com ginger ale;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
    category: 'Whisky',
  }),
];

const SUGGESTION_SLUGS = new Set(DRINK_SUGGESTION_CATALOG.map((drink) => drink.slug));

/** Corrige drinks adicionados via sugestões com thumb legado (mapeamento errado). */
export function repairCustomDrinkImage(drink: ViniciusDrink): ViniciusDrink {
  if (isCatalogDrinkSlug(drink.slug)) return drink;
  if (!SUGGESTION_SLUGS.has(drink.slug)) return drink;
  const expected = drinkThumbPath(drink.slug);
  if (drink.imageUrl === expected) return drink;
  return { ...drink, imageUrl: expected };
}

export type NewDrinkSuggestion = {
  drink: ViniciusDrink;
  match: DrinkAdegaMatch;
};

export function getNewDrinkSuggestions(
  existingSlugs: Set<string>,
  adegaItems: AdegaItem[],
): NewDrinkSuggestion[] {
  return DRINK_SUGGESTION_CATALOG.filter((drink) => !existingSlugs.has(drink.slug))
    .map((drink) => ({
      drink,
      match: matchDrinkToAdega(drink, adegaItems),
    }))
    .sort((a, b) => {
      const rank = (status: DrinkAdegaMatch['status']) =>
        status === 'ready' ? 0 : status === 'partial' ? 1 : 2;
      const diff = rank(a.match.status) - rank(b.match.status);
      if (diff !== 0) return diff;
      return a.match.missingLabels.length - b.match.missingLabels.length;
    });
}
