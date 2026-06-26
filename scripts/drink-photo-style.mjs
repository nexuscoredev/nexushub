/**
 * Padrão visual para fotos de drinks (Gemini / IA).
 *
 * Workflow:
 * 1. node scripts/drink-photo-prompts.mjs --slug mojito
 * 2. Gerar imagem no Gemini com o prompt (2:3, sem texto)
 * 3. node scripts/import-drink-photo.mjs --slug mojito --from caminho.png
 */

export const DRINK_PHOTO_STYLE_SUFFIX =
  'realistic ice cubes, premium cocktail menu icon, dark black background, soft cinematic lighting, shallow depth of field, luxury bar atmosphere, wooden counter, professional beverage photography, isolated drink, no text, no logo, no watermark, portrait composition 2:3, photorealistic';

/**
 * @param {{ title: string, glass: string, liquid: string, garnish: string }} visual
 */
export function buildDrinkPhotoPrompt(visual) {
  const { title, glass, liquid, garnish } = visual;
  return [
    'Ultra realistic cocktail photography,',
    title + ',',
    'centered composition,',
    `${glass} with ${liquid},`,
    `${garnish},`,
    DRINK_PHOTO_STYLE_SUFFIX,
  ].join(' ');
}

/** Especificações visuais das artes-base (fonte do Google Sites ou Gemini). */
export const DRINK_PHOTO_VISUALS = {
  'whisky-sour': {
    title: 'Whisky Sour',
    glass: 'crystal coupe glass',
    liquid: 'pale golden sour cocktail with silky foam head',
    garnish: 'lemon wheel and maraschino cherry',
  },
  'whisky-cola': {
    title: 'Whisky Cola',
    glass: 'tall highball crystal glass',
    liquid: 'dark cola brown mixer with whisky',
    garnish: 'lemon wedge on the rim',
  },
  mojito: {
    title: 'Mojito',
    glass: 'tall highball crystal glass',
    liquid: 'clear sparkling mojito with fresh mint',
    garnish: 'mint sprig and lime wedge',
  },
  negroni: {
    title: 'Negroni',
    glass: 'short rocks crystal glass',
    liquid: 'deep ruby red bitter negroni',
    garnish: 'orange peel twist',
  },
  'moscow-mule': {
    title: 'Moscow Mule',
    glass: 'copper mug or tall highball glass',
    liquid: 'amber ginger beer cocktail',
    garnish: 'lime wedge',
  },
  daiquiri: {
    title: 'Daiquiri',
    glass: 'elegant coupe glass',
    liquid: 'pale straw yellow rum daiquiri',
    garnish: 'thin lime wheel',
  },
  margarita: {
    title: 'Margarita',
    glass: 'margarita glass with salt rim',
    liquid: 'pale lime green tequila margarita',
    garnish: 'lime wheel on salted rim',
  },
  'margarita-blue': {
    title: 'Margarita Blue',
    glass: 'margarita glass with salt rim',
    liquid: 'vibrant electric blue margarita',
    garnish: 'lime wheel on salted rim',
  },
  'dry-martini': {
    title: 'Dry Martini',
    glass: 'classic martini glass',
    liquid: 'crystal clear gin martini',
    garnish: 'green olive on pick',
  },
  'vesper-martini': {
    title: 'Vesper Martini',
    glass: 'classic martini glass',
    liquid: 'crystal clear vesper martini',
    garnish: 'lemon peel twist',
  },
  'cuba-libre': {
    title: 'Cuba Libre',
    glass: 'tall highball crystal glass',
    liquid: 'dark cola with rum',
    garnish: 'lime wedge',
  },
  cozumel: {
    title: 'Cozumel',
    glass: 'margarita or rocks glass',
    liquid: 'pale golden tequila citrus cocktail',
    garnish: 'lime wheel',
  },
  'blue-lagoon': {
    title: 'Blue Lagoon',
    glass: 'tall highball crystal glass with diamond cut pattern',
    liquid: 'vibrant electric blue cocktail',
    garnish: 'fresh mint sprig, lemon wheel on rim, metal bar spoon',
  },
  'bloody-mary': {
    title: 'Bloody Mary',
    glass: 'tall highball crystal glass with diamond cut pattern',
    liquid: 'deep tomato red bloody mary',
    garnish: 'celery stalk garnish and lemon wedge',
  },
  'gin-tonic': {
    title: 'Gin and Tonic',
    glass: 'tall highball crystal glass',
    liquid: 'clear sparkling gin and tonic',
    garnish: 'lime wheel',
  },
  'old-fashioned': {
    title: 'Old Fashioned',
    glass: 'short rocks crystal glass',
    liquid: 'amber whisky old fashioned',
    garnish: 'orange peel and cherry',
  },
  manhattan: {
    title: 'Manhattan',
    glass: 'coupe or martini glass',
    liquid: 'deep amber red manhattan',
    garnish: 'brandied cherry',
  },
  'rum-cola': {
    title: 'Rum and Cola',
    glass: 'tall highball crystal glass',
    liquid: 'dark cola with rum',
    garnish: 'lime wedge',
  },
  'tequila-sunrise': {
    title: 'Tequila Sunrise',
    glass: 'tall highball glass',
    liquid: 'orange sunrise gradient cocktail',
    garnish: 'orange slice and cherry',
  },
  'gin-fizz': {
    title: 'Gin Fizz',
    glass: 'tall highball glass',
    liquid: 'pale fizzy gin fizz',
    garnish: 'lemon slice',
  },
  'whiskey-smash': {
    title: 'Whiskey Smash',
    glass: 'rocks glass',
    liquid: 'golden whisky smash',
    garnish: 'mint sprig and lemon wedge',
  },
  paloma: {
    title: 'Paloma',
    glass: 'tall highball glass',
    liquid: 'pale pink grapefruit tequila paloma',
    garnish: 'grapefruit wedge and salt rim',
  },
  'tom-collins': {
    title: 'Tom Collins',
    glass: 'tall collins glass',
    liquid: 'clear fizzy tom collins',
    garnish: 'lemon slice and cherry',
  },
  'aperol-spritz': {
    title: 'Aperol Spritz',
    glass: 'large wine glass',
    liquid: 'orange aperol spritz with bubbles',
    garnish: 'orange slice',
  },
  'french-75': {
    title: 'French 75',
    glass: 'champagne flute',
    liquid: 'golden sparkling french 75',
    garnish: 'lemon twist',
  },
  caipirinha: {
    title: 'Caipirinha',
    glass: 'short rocks glass',
    liquid: 'cloudy lime cachaça caipirinha',
    garnish: 'muddled lime wedges',
  },
  caipitudo: {
    title: 'Caipitudo',
    glass: 'short rocks glass',
    liquid: 'tropical fruit caipirinha style cocktail',
    garnish: 'fresh fruit pieces',
  },
  'caipiroska-de-limao': {
    title: 'Caipiroska de Limão',
    glass: 'short rocks glass',
    liquid: 'cloudy lime vodka caipiroska',
    garnish: 'muddled lime',
  },
  'caipiroska-de-maracuja': {
    title: 'Caipiroska de Maracujá',
    glass: 'short rocks glass',
    liquid: 'yellow passion fruit caipiroska',
    garnish: 'passion fruit seeds and lime',
  },
};

/** Título legível a partir do slug quando não há spec dedicada. */
export function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bAnd\b/g, 'and');
}
