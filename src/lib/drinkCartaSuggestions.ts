import { matchDrinkToAdega, type DrinkAdegaMatch } from './drinkAdegaMatch';
import type { ViniciusDrink } from './viniciusDrinksCarta';
import type { AdegaItem } from './viniciusAdega';

export const DRINK_SUGGESTION_PLACEHOLDER_THUMB = '/img/personal/drinks/thumbs/daiquiri.jpg';

/** Receitas clássicas que ainda não estão na carta padrão. */
export const DRINK_SUGGESTION_CATALOG: ViniciusDrink[] = [
  {
    slug: 'caipirinha',
    title: 'Caipirinha',
    tagline: 'Cachaça, limão e açúcar — o clássico brasileiro batido na mão.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
    ingredients: ['1 limão cortado em pedaços', '2 colheres de açúcar', '60ml de Cachaça', 'Gelo'],
    steps: [
      'Macere o limão com o açúcar no copo;',
      'Acrescente a cachaça e o gelo;',
      'Misture bem e sirva.',
    ],
    notes: 'Drink misturado (não batido na coqueteleira)!',
  },
  {
    slug: 'gin-tonic',
    title: 'Gin Tonic',
    tagline: 'Gin, tônica e limão — seco, refrescante e direto ao ponto.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
    ingredients: ['50ml de Gin', '150ml de Refrigerante tônica', 'Gelo', '1 rodela de limão'],
    steps: [
      'Gele o copo;',
      'Acrescente o gin;',
      'Complete com tônica;',
      'Decore com limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'old-fashioned',
    title: 'Old Fashioned',
    tagline: 'Whisky, açúcar e bitter — clássico americano na rocha.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'manhattan',
    title: 'Manhattan',
    tagline: 'Whisky, vermute e bitter — elegante e aromático.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
    ingredients: ['50ml de Whisky', '25ml de Vermute', '2 dashes de bitter', 'Gelo'],
    steps: [
      'Misture whisky, vermute e bitter com gelo;',
      'Coe para taça gelada;',
      'Decore com cereja ou casca de limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'rum-cola',
    title: 'Rum Cola',
    tagline: 'Rum, cola e limão — simples e sempre funciona.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
    ingredients: ['50ml de Rum', '150ml de Coca Cola', 'Gelo', 'Suco de 1/2 limão'],
    steps: [
      'Gele o copo;',
      'Acrescente rum e limão;',
      'Complete com cola;',
      'Misture suavemente.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'tequila-sunrise',
    title: 'Tequila Sunrise',
    tagline: 'Tequila, suco de laranja e grenadine — visual de pôr do sol.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'gin-fizz',
    title: 'Gin Fizz',
    tagline: 'Gin, limão, xarope e soda — leve e cítrico.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'whiskey-smash',
    title: 'Whiskey Smash',
    tagline: 'Whisky, limão e hortelã — aromático e refrescante.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'paloma',
    title: 'Paloma',
    tagline: 'Tequila, grapefruit soda e limão — mexicano e cítrico.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'tom-collins',
    title: 'Tom Collins',
    tagline: 'Gin, limão, xarope e soda — alto, gelado e clássico.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'aperol-spritz',
    title: 'Aperol Spritz',
    tagline: 'Aperol, espumante e soda — leve e laranja.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
  {
    slug: 'french-75',
    title: 'French 75',
    tagline: 'Gin, limão, xarope e espumante — festivo e elegante.',
    imageUrl: DRINK_SUGGESTION_PLACEHOLDER_THUMB,
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
  },
];

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
