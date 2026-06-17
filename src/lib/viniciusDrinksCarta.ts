export interface ViniciusDrink {
  slug: string;
  title: string;
  tagline: string;
  imageUrl: string;
  ingredients: string[];
  steps: string[];
  notes?: string;
}

/** Banner compartilhado do site original (bar com coquetéis). */
export const VINICIUS_DRINKS_BANNER_URL =
  'https://lh3.googleusercontent.com/sitesv/AA5AbUCvaa7bFZ2tEXrgvZDfCJhbm0vPLU66ltzFeoVfkaDPLXeHwZtlNPIcVZVg9bxsTaZ7cn2ez3O08k9x4g7zr1nbm4vejFCvQW_7-ICSz0F-CVg_P6HRPP7u0IirghCUEkbqlxHtVXmyQR89jUxOAOR1XKEISCoUBhuTh4D9t5ZbAGfZsrFklTGeYvyWPGA=w16383';

export const VINICIUS_DRINKS_SITE_BASE = 'https://sites.google.com/view/drinksv/inicio';

export const VINICIUS_DRINKS: ViniciusDrink[] = [
  {
    slug: 'whisky-sour',
    title: 'Whisky Sour',
    tagline: 'Whisky, limão e um toque doce, bem batido pra ficar cremoso.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUA9qv5k3C_zZEF0Q7z2kkYRyPvDIDgAjk_oJHCUH7irBB9KTrszCYTw_225hiIKlxCoHRq1UBjF67NE_0zGgznYhVszGhGmK0cZUadqt7GaE70FxS8AGdKObx7r_DB_Xt-EGnI0vMlPwwxAd6a62YE0eDhUj8UgN7t525hWgch7Psh28aKujbOxMISaDz0=w1280',
    ingredients: ['1 Limão', '1/2 dose de xarope de açúcar', '60ml de Whisky'],
    steps: ['Esprema o limão;', 'Ferva o xarope de açúcar;', 'Acrescentar whisky;'],
    notes: 'Xarope de açúcar = 1 de água para de açúcar. Drink batido!',
  },
  {
    slug: 'whisky-cola',
    title: 'Whisky Cola',
    tagline: 'Whisky, Coca-Cola, Gelo e Limão',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUBgWwbIP3J-Fu66XwaCfhiw0fwfwAK5iDiujJkIKciSKUoBtuff1QChGI4dK0-d2EXOZRYjVm5fo-m0U3JNTIJyemxsZmG8org--1GwiYbJthb-EkSJgueHbWX_a14DNgXc4mUfvx9C4jzRECcfYkz3iqZXNcoqSTZ82fTlU9-xC0Y0Lwjmbrq7RekjqkE=w1280',
    ingredients: ['1 limão ou 1/2', '1 dose de Whisky', '1 Coca Cola'],
    steps: ['Esprema o limão;', 'Acrescente o Whisky;', 'Acrescente a Coca-Cola;'],
    notes: 'De preferência sem coqueteleira. Drink misturado (não batido)!',
  },
  {
    slug: 'mojito',
    title: 'Mojito',
    tagline: 'Cerveja gelada, limão e sal na borda — versão bem brasileira.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUBksYlAkHJAGr-XBD-QgTS5ETZnAq-MkwRuf_Je99-pDCsVwXblugCFlK-NNNHJGSlo1r-q0HHijk5yGs6HWJ7MIrAcHz5cgsyEf2HqBoxONW1WgRcdXPCMTuBYLJad-6a-ofwwrX-UdtaeKckEl0je6dMD5JWE8-lARAyl2PmEP0tYsvWKT-Ass7-L52Q=w1280',
    ingredients: [
      '1 lata ou garrafa de cerveja clara (preferencialmente pilsen), bem gelada',
      'Suco de 1/2 limão-taiti (cerca de 20 ml)',
      'Sal a gosto',
      'Gelo a gosto',
      'Meio limão cortado (para a borda e decoração)',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Acrescentar gelo e limão;',
      'Acrescentar a cerveja;',
      'Finalize: Decore com uma rodela ou fatia de limão e sirva imediatamente.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'negroni',
    title: 'Negroni',
    tagline: 'Clássico amargo e elegante — gin, vermute e bitter.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUBXCP1Rmbieqp8bU3ToYU9EBoZbxKsH4aU1Gv18NKTEGWQOvsyHcTNYXKPj-k3jWqEJbAJAgMNxgv-FHD7cpKh00N70uxzkBZMIsuv1ghUoX96hKg79irtQau5LocA05jZCoAce0aL7My_Cwhlbzz9vkWscxkLO3orSAh8LZwikz5DQ0TKtJpeb2AlC=w1280',
    ingredients: [
      '1 lata ou garrafa de cerveja clara (preferencialmente pilsen), bem gelada',
      'Suco de 1/2 limão-taiti (cerca de 20 ml)',
      'Sal a gosto',
      'Gelo a gosto',
      'Meio limão cortado (para a borda e decoração)',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Acrescentar gelo e limão;',
      'Acrescentar a cerveja;',
      'Finalize: Decore com uma rodela ou fatia de limão e sirva imediatamente.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'moscow-mule',
    title: 'Moscow Mule',
    tagline: 'Vodka, ginger beer e limão na caneca de cobre.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUDK-e8l5wS4kSEsRomP8ZsS37bpwNg2z8YgiKiiC1V1eZxlNnud8i81oKCM8hyNp5iJqRjKvDzTBxSmJGA3nOlNCbtN5E0chzsGL-Hev_FdGInDFpmzULrT-174FDT8J6J-9squKN3ol4vR7lc0jo3IrXIaVsqga1JORT8wMwgSHSGMdkSG9yOZ92zPnyM=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUDxca0CyaPTPjAuLAWJyNuRshuK_8hYZhpekNcHXxDITPUZoO_9mXLQGd57LRzQwAFzy1NufRHtfucPseJTfnlNz6lzpl-XcGW-8rVMf37De8JDAueSgvid6aIpR7Qj2F65QBpYPMcJZ59mY8Eqcd7M3AK61t_Jkfo9ac7Hpc6-n2OmPggqAXKYk5nGHlg=w1280',
    ingredients: ['1 ou 2 Limões', '1/2 dose de xarope de açúcar', '60ml de Rum Carta Branca'],
    steps: ['Esprema o limão;', 'Ferva o xarope de açúcar;', 'Acrescentar Rum;'],
    notes: 'Xarope de açúcar = 1 de água para de açúcar. Drink batido!',
  },
  {
    slug: 'margarita',
    title: 'Margarita',
    tagline: 'Tequila, triple sec e limão com borda salgada.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUCoMRRC6Hz4BqI4iTnwkGuyNIMCfCPEVU_5EHxHDEJ7oFEtOsdqMMt4LXqgzO7LzcMzG7vxnE6TXsgMA6nOzgtcuFR26bNXjnwPJPGwi31MGO1ZLtmy1wRP-9OEJviPSIMpHo3J1z8tb8T1sF3DrpiG80vzUnsR19SquymPlTy8CtCuCXJahmPbguX5LGWxg288AwC32JDG2Url-5mN8-J-nHyywdKHsDLZUzViFuE=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUDgTM1VtCRiWk4gEGUUsIisQ7PdkpW_6ja4jr-msYJ3ShvFULYGn2rP1M-2DywB2WUlpwxB0Owq8w94pD0xot48_bRFQuzp6wKUeN78bIy2kWpqunuIpzIPUzTexBW5nBl7zc0cJ9kvsZbnAl2T2s_tU2nN5OW1BPjmGFAv7IsnmJSFQ0k0df-YyvIv=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUABD7PP6vgVId842txdqzopRFInlQ1h0IH9WPW-gORlUT50fnOqfdOq8y-nj44VKoQLzXYLFmOp6yaSPGJtNDAoAgK12fNdTqL_d0hvVgLUyWWWWL74nJAPckz4EqwNOdwmXLK6Wiq8TM6IVq0evkxQ4pZ_bvm2pNlp4X3tQQjxR-L52fvyue04sHFs2dU=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUB7npUk35ffxbTQhrjnTVN5Uaho82zGM73mfhU8aJfuaPh0_1LaLAd_DGh1Pw3npUcCqfhjo8fAy9Q7LIGdgfhJKwe4KoJoBTcBiWXIGnRB1f0ey_sT5Gu5vkwtdfEAu8_DoZjuO_fiRx4ZeUdx-_1__b_Ss5M7p6tG8kUQxg18kNUECJw7uAp5fjPX=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUA6TCTZo4eYnMefZq06nAQhm9pi_bqn_SB46PqVO7E7CzaNxxqDL8XOBvE1d3hSyfud-2Z-kkaehP_bfek0PHKDSJG4OKshACCZjWZDJe5ac42Nfvj3zr8gOWU0iSBEIJqhWfy3sWcNRN9jJ92-ZNgAWS__96q71s-hG8bp_EE7TnVEWHzGAmtn8oqME-U=w1280',
    ingredients: [
      '1 lata ou garrafa de cerveja clara (preferencialmente pilsen), bem gelada',
      'Suco de 1/2 limão-taiti (cerca de 20 ml)',
      'Sal a gosto',
      'Gelo a gosto',
      'Meio limão cortado (para a borda e decoração)',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Acrescentar gelo e limão;',
      'Acrescentar a cerveja;',
      'Finalize: Decore com uma rodela ou fatia de limão e sirva imediatamente.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'cozumel',
    title: 'Cozumel',
    tagline: 'Tequila e limão com toque doce — leve e cítrico.',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUAPd1kdUh9ZFSn1FyRRXgSpZfC-_qV2HQHxxMQQe9LDAkblcpCBYfYhR2EvfUZpqPumLR_Sk9MSJ2S7_-HAgl3IJOZEnGCZ_VYmr36OkSTYLe8doF7R14reUgCWRPZfnoE0Af-1fxIWM68PF2m59SLB-fdzkPLOM2jfC_EbNTCofq4sAmqVZRy0hnjEzcIwcyZ8rGPiMNU0SFJ5ZIkoTgA4WNpuO9bMKKdvTgfNmkk=w1280',
    ingredients: [
      '1 lata ou garrafa de cerveja clara (preferencialmente pilsen), bem gelada',
      'Suco de 1/2 limão-taiti (cerca de 20 ml)',
      'Sal a gosto',
      'Gelo a gosto',
      'Meio limão cortado (para a borda e decoração)',
    ],
    steps: [
      'Esfregue a fatia de limão na borda de uma taça, coloque sal espalhado em um prato e encoste a borda da taça no prato para fazer a crosta de sal na taça.',
      'Acrescentar gelo e limão;',
      'Acrescentar a cerveja;',
      'Finalize: Decore com uma rodela ou fatia de limão e sirva imediatamente.',
    ],
    notes: 'Drink misturado (não batido)!',
  },
  {
    slug: 'caipitudo',
    title: 'Caipitudo',
    tagline:
      'O clássico do seu jeito. Escolha sua fruta fresca e seu destilado favorito (cachaça, vodka ou saquê).',
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUBMFKsPtem5KwGpOROH5xupZA5vtkUYRAF9tG7xBhcKNDiO_bHAoznIpz62Wmn5NnHOWb-le8E_FIhbr7S6QFM9YF5O1LGFBq_LznDYa3iluyKJJtkGx9eO8Q3QQwtMWqPdh3zkYXs8zAEYn4iJuMSwnCP5pamPnKcaxQwOCO0bJeNrgjyh9tv3UCx8OwQ=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUAG7-Rp1mHkCRCaqHxYSiMJQqiKX-IXRKzLVjFZs-HbBKneOp7EmX7R8vBTZ3qafRHZ9tM1ivk6GZDFY2OQwlbiqLjt58iRQbil-S4dNEkd15al_zQH90ZfQtJCbIv2h4MnqOA3lz_iMOx3XuDZ3N_V40o3-ZloOkZtprFNpUeoDFiu7OHyRtHoCw=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUDO6y2sxvbXO_Mn55JCG_xOW9iFibvjkpEtb7z65BcNeY_NyccuGhr_Cp7kfd5cX9PahcJUEMp9HdXDuBUFtG1UOGoVpJrqungccj6lQQYd5n1lwCz6X3G0qrG3jp3KiTT7bJzCG_Q3hfjpJXEJRtDFXeHbgogoWA2Nv4mEhdtJMlhC-q84xCxjsntOF6E=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUCc6DMt-6z74hlmEBih4EtiA8cpGWy1GhFTmOOikAJsOpIkEA1133yOaBeXaWi0cJHLUgYVuuWhp_bmf9lPxrEdVvhrZjC9hnV-i9nV2jhtWIHSijGxiDpqev6EYk6gRQzeOVRPdJzQD-yXKM-XInWVQDAaKvH-_NkNmdqFIIgbx-xzXiTGXy9yr9aV7t4CyJgww0o9pc28KfJvwusrRBM5K-ceN4Fuc1ndkmCJ4ao=w1280',
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
    imageUrl:
      'https://lh3.googleusercontent.com/sitesv/AA5AbUANQR8_TyMxMWS6JyjL5tipo_70aJ1wOSrO3n1PZQt3nkUKKhlwNjtRTd0vFHlpSy_mHz7fKNUtsUAuQVUwGdtVB_TlEJ7wawbqghenYkGyZQ4Ssd9Enc85ra8TDvF8npOcp7yt37LhkFIJ6u3UmHMae_59jegehYAWm8o_-7OIm_4z-4D2Jrr495P53Fc=w1280',
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
