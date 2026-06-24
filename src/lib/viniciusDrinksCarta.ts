export interface ViniciusDrink {
  slug: string;
  title: string;
  tagline: string;
  imageUrl: string;
  ingredients: string[];
  steps: string[];
  notes?: string;
  garnish?: string[];
  variations?: string[];
  category?: string;
}

/** Imagens locais (hotlink do Google Sites quebra em produção). */
export function drinkImagePath(slug: string): string {
  return `/img/personal/drinks/${slug}.jpg`;
}

/** Foto só do copo (sem texto da receita na arte). */
export function drinkThumbPath(slug: string): string {
  return `/img/personal/drinks/thumbs/${slug}.jpg`;
}

export const DRINK_FALLBACK_THUMB = drinkThumbPath('daiquiri');

/** Banner principal da carta (arte com título integrado). */
export const VINICIUS_DRINKS_BANNER_WIDTH = 1024;
export const VINICIUS_DRINKS_BANNER_HEIGHT = 576;
export const VINICIUS_DRINKS_BANNER_URL = '/img/personal/drinks/banner.png?v=2';

export const VINICIUS_DRINKS_SITE_BASE = 'https://sites.google.com/view/drinksv/inicio';

export const VINICIUS_DRINKS: ViniciusDrink[] = [
  {
    slug: 'whisky-sour',
    title: 'Whisky Sour',
    tagline: 'Whisky, limão e um toque doce, bem batido pra ficar cremoso.',
    imageUrl: drinkThumbPath('whisky-sour'),
    ingredients: ['1 Limão', '1/2 dose de xarope de açúcar', '60ml de Whisky'],
    steps: ['Esprema o limão;', 'Ferva o xarope de açúcar;', 'Acrescentar whisky;'],
    notes: 'Xarope de açúcar = 1 de água para de açúcar. Drink batido!',
  },
  {
    slug: 'whisky-cola',
    title: 'Whisky Cola',
    tagline: 'Whisky, Coca-Cola, Gelo e Limão',
    imageUrl: drinkThumbPath('whisky-cola'),
    ingredients: ['1 limão ou meio limão', '1 dose de Whisky', '1 Coca Cola'],
    steps: ['Esprema o limão;', 'Acrescente o Whisky;', 'Acrescente a Coca-Cola;'],
    notes: 'De preferência sem coqueteleira. Drink misturado (não batido)!',
  },
  {
    slug: 'mojito',
    title: 'Mojito',
    tagline: 'Rum branco, hortelã, limão e água com gás — refrescante e clássico.',
    imageUrl: drinkThumbPath('mojito'),
    ingredients: [
      '8 folhas de hortelã',
      'Suco de 1/2 limão-taiti',
      '2 colheres de açúcar',
      '60 ml de Rum branco',
      'Água com gás',
      'Gelo',
    ],
    garnish: ['Ramo de hortelã', 'Rodela de limão'],
    steps: [
      'Macere a hortelã com o açúcar e o suco de limão no copo;',
      'Acrescente o rum e o gelo;',
      'Complete com água com gás e misture suavemente;',
      'Decore com hortelã e uma rodela de limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'negroni',
    title: 'Negroni',
    tagline: 'Clássico amargo e elegante — gin, vermute e bitter.',
    imageUrl: drinkThumbPath('negroni'),
    ingredients: [
      '30 ml de Gin',
      '30 ml de Campari',
      '30 ml de Vermute Rosso',
      'Gelo',
    ],
    garnish: ['Casca de laranja'],
    steps: [
      'Em um copo rocks com gelo, acrescente gin, Campari e vermute;',
      'Mexa delicadamente;',
      'Finalize com a casca de laranja.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'moscow-mule',
    title: 'Moscow Mule',
    tagline: 'Vodka, ginger beer e limão na caneca de cobre.',
    imageUrl: drinkThumbPath('moscow-mule'),
    ingredients: [
      '50ml de Vodka;',
      'Suco de 1/2 limão thaiti;',
      'Ginger Beer/Soda;',
      'Uma fatia de limão;',
      'Gelo;',
    ],
    steps: [
      'Gele a caneca de cobre;',
      'Acrescente a Vodka;',
      'Acrescente o suco de 1/2 limão;',
      'Acrescente o gelo;',
      'Acrescente a Ginger Beer/Soda, completando a caneca até o topo.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'daiquiri',
    title: 'Daiquiri',
    tagline: 'Direto do Caribe pro seu copo. Rum branco, limão e açúcar.',
    imageUrl: drinkThumbPath('daiquiri'),
    ingredients: ['1 ou 2 Limões', '1/2 dose de xarope de açúcar', '60ml de Rum Carta Branca'],
    steps: ['Esprema o limão;', 'Ferva o xarope de açúcar;', 'Acrescentar Rum;'],
    notes: 'Xarope de açúcar = 1 de água para de açúcar. Drink batido!',
  },
  {
    slug: 'margarita',
    title: 'Margarita',
    tagline: 'Tequila, triple sec e limão com borda salgada.',
    imageUrl: drinkThumbPath('margarita'),
    ingredients: [
      'Gelo',
      'Sal',
      '20ml de cointreau',
      '1 limão inteiro',
      '1 fatia de limão',
      '1 dose de tequila',
      '20ml de xarope de açúcar',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Coloque em uma coqueteleira o suco de limão, licor, tequila e cubos de gelo.',
      'Agite bem e despeje na taça eliminando as pedras de gelo.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'margarita-blue',
    title: 'Margarita Blue',
    tagline: 'Margarita com curaçau blue — visual e sabor marcantes.',
    imageUrl: drinkThumbPath('margarita-blue'),
    ingredients: [
      'Gelo',
      'Sal',
      '1/2 dose de Licor Curaçau Blue',
      '1 limão inteiro',
      '1 fatia de limão',
      '1 dose de tequila',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Coloque em uma coqueteleira o suco de limão, licor, tequila e cubos de gelo.',
      'Agite bem e despeje na taça eliminando as pedras de gelo.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'dry-martini',
    title: 'Dry Martini',
    tagline: 'Gin e vermute seco, bem gelado — seco e clássico.',
    imageUrl: drinkThumbPath('dry-martini'),
    ingredients: ['60 ml de gin', '20 ml de Vermouth Extra Dry', 'Azeitona'],
    steps: [
      'Em uma coqueteleira com gelo, coloque o gin e o Vermouth. Misture!',
      'Coe para uma taça martini;',
      'Finalize com uma casquinha de limão-siciliano.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'vesper-martini',
    title: 'Vesper Martini',
    tagline: 'Gin, vodka e Lillet — o martini de James Bond.',
    imageUrl: drinkThumbPath('vesper-martini'),
    ingredients: [
      '60 ml de gin',
      '20 ml de vodka',
      '10 ml de Vermouth Lillet',
      'Casquinha de limão-siciliano',
    ],
    steps: [
      'Em uma coqueteleira com gelo, coloque o gin, a vodka e o vermouth. Bata!',
      'Coe para uma taça martini;',
      'Finalize com uma casquinha de limão-siciliano.',
    ],
    notes: 'Drink batido!',
  },
  {
    slug: 'cuba-libre',
    title: 'Cuba Libre',
    tagline: 'Rum, cola e limão — tropical e fácil.',
    imageUrl: drinkThumbPath('cuba-libre'),
    ingredients: [
      '50 ml de Rum',
      'Suco de 1/2 limão-taiti',
      'Coca-Cola',
      'Gelo',
    ],
    garnish: ['Rodela de limão'],
    steps: [
      'Em um copo alto com gelo, acrescente o rum e o suco de limão;',
      'Complete com Coca-Cola;',
      'Mexa e decore com uma rodela de limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'cozumel',
    title: 'Cozumel',
    tagline: 'Tequila, triple sec e limão — leve e cítrico.',
    imageUrl: drinkThumbPath('cozumel'),
    ingredients: [
      '50 ml de Tequila',
      '25 ml de Triple Sec',
      'Suco de 1 limão-taiti',
      'Gelo',
    ],
    garnish: ['Rodela de limão'],
    steps: [
      'Em uma coqueteleira com gelo, acrescente tequila, triple sec e suco de limão;',
      'Agite bem e coe para um copo com gelo;',
      'Decore com uma rodela de limão.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'caipitudo',
    title: 'Caipitudo',
    tagline:
      'O clássico do seu jeito. Escolha sua fruta fresca e seu destilado favorito (cachaça, vodka ou saquê).',
    imageUrl: drinkThumbPath('caipitudo'),
    ingredients: [
      '2 ou 1 fruta(s) de sua escolha',
      '2 colheres de açúcar',
      'Gelo',
      '1 dose (50ml) de cachaça/vodka/saquê',
    ],
    steps: [
      'Corte a fruta e os talos (se possuir);',
      'Coloque a fruta virada para cima na coqueteleira e macere com o açúcar (ou simplesmente acrescente a polpa);',
      'Acrescente o gelo;',
      'Acrescente a dose de cachaça/vodka/saquê de acordo com o gosto.',
    ],
    notes: 'Drink batido!',
  },
  {
    slug: 'caipiroska-de-limao',
    title: 'Caipiroska de Limão',
    tagline: 'Limões macerados com açúcar, Vodka e gelo.',
    imageUrl: drinkThumbPath('caipiroska-de-limao'),
    ingredients: [
      '2 limões thaiti ou siciliano',
      '2 colheres de açúcar',
      'Gelo',
      '1 dose (50ml) de Vodka',
    ],
    steps: [
      'Corte o limão e os talos;',
      'Coloque o limão virado para cima na coqueteleira e macere com o açúcar;',
      'Acrescente o gelo;',
      'Acrescente a dose de Vodka;',
    ],
    notes: 'Drink batido!',
  },
  {
    slug: 'caipiroska-de-maracuja',
    title: 'Caipiroska de Maracujá',
    tagline:
      'Tropical e vibrante. A acidez do maracujá fresco perfeitamente equilibrada com vodka e açúcar.',
    imageUrl: drinkThumbPath('caipiroska-de-maracuja'),
    ingredients: [
      '1 limão thaiti ou siciliano',
      '2 colheres de açúcar',
      'Gelo',
      '1 maracujá',
      '1 dose (50ml) de Vodka',
    ],
    steps: [
      'Corte o limão e os talos;',
      'Coloque o limão virado para cima na coqueteleira e macere com o açúcar;',
      'Acrescente o gelo;',
      'Acrescente o maracujá;',
      'Acrescente a dose de vodka;',
    ],
    notes: 'Drink batido!',
  },
  {
    slug: 'blue-lagoon',
    title: 'Blue Lagoon',
    tagline: 'Vodka, curaçau blue e limão — azul e tropical.',
    imageUrl: drinkThumbPath('blue-lagoon'),
    ingredients: [
      'Gelo a gosto',
      'Rodela de limão-siciliano para decorar',
      '50 ml de vodka',
      '35 ml de Curaçao Blue',
      '100 ml de refrigerante de limão ou de suco de limão siciliano',
    ],
    steps: [
      'Pegue as bebidas que você precisa para preparar o drink Lagoa Azul.',
      'Corte uma, ou mais, rodela de limão-siciliano não tão fina.',
      'Em uma taça alta, coloque gelo a gosto e a rodela de limão.',
      'Despeje a vodka e o Curaçao Blue.',
      'Complete com o refrigerante de limão.',
      'Use um canudinho para misturar a bebida.',
      'Decore a taça como preferir e já pode servir.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'bloody-mary',
    title: 'Bloody Mary',
    tagline: 'Vodka, tomate e especiarias — salgado e encorpado.',
    imageUrl: drinkThumbPath('bloody-mary'),
    ingredients: [
      '50ml de Vodka;',
      'Suco de 1/2 limão thaiti',
      '2 dash Molho Inglês',
      '4 gotas de Tabasco',
      '3 pitadas de Sal',
      'Suco de tomate',
    ],
    steps: [
      'Acrescentar o limão',
      'Acrescente o molho inglês',
      'Acrescente a pimenta tabasco',
      'Acrescente o Sal',
      'Acrescente a vodka e o gelo',
      'Complete com o suco de tomate',
    ],
    notes: 'Drink misturado (não batido)!',
  },
];

const CATALOG_DRINK_SLUGS = new Set(VINICIUS_DRINKS.map((drink) => drink.slug));

export function isCatalogDrinkSlug(slug: string): boolean {
  return CATALOG_DRINK_SLUGS.has(slug);
}

export function drinkSitePath(slug: string): string {
  const map: Record<string, string> = {
    'caipiroska-de-limao': 'caipiroska-de-lim%C3%A3o',
    'caipiroska-de-maracuja': 'caipiroska-de-maracuj%C3%A1',
  };
  return map[slug] ?? slug;
}

export function drinkSiteUrl(slug: string): string {
  return `${VINICIUS_DRINKS_SITE_BASE}/${drinkSitePath(slug)}`;
}

export function findViniciusDrink(slug: string | null | undefined): ViniciusDrink | undefined {
  if (!slug) return undefined;
  return VINICIUS_DRINKS.find((d) => d.slug === slug);
}
