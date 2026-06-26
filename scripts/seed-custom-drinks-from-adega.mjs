/**
 * Lista sugestões "ready" com a adega atual.
 * Uso: node scripts/seed-custom-drinks-from-adega.mjs
 */
import { getNewDrinkSuggestions } from '../src/lib/drinkCartaSuggestions.ts';
import { VINICIUS_DRINKS } from '../src/lib/viniciusDrinksCarta.ts';

const USER_ID = '159a1fe7-65b4-4465-ace9-9606aefe00d6';

const adegaItems = [
  { id: 'adega-mqsij9kx-ecf10', kind: 'ingredient', name: 'Açúcar', category: 'Açúcar', quantity: 1 },
  { id: 'adega-mqjk7b07-agton', kind: 'ingredient', name: 'Água Tônica', category: 'Refrigerante / mixer', quantity: 1 },
  { id: 'adega-mqoh98w5-u48tj', name: 'Aperitivo Lillet Blanc', category: 'Vermouth', quantity: 1 },
  { id: 'adega-mqjk7b03-bacap', name: 'Bacardi Big Apple', category: 'Rum', quantity: 1 },
  { id: 'adega-mqjk7b01-bllna', name: 'Ballena', category: 'Tequila', quantity: 1 },
  { id: 'adega-mqjk7b08-cocac', kind: 'ingredient', name: 'Coca-Cola 600 ml', category: 'Refrigerante / mixer', quantity: 1 },
  { id: 'adega-mqjk7b05-cvbnc', name: 'Cortezano Vermouth Bianco', category: 'Vermouth', quantity: 1 },
  { id: 'adega-mqjk7b04-cvrss', name: 'Cortezano Vermouth Rosso', category: 'Vermouth', quantity: 1 },
  { id: 'adega-mqoh0nse-dot6f', kind: 'ingredient', name: 'Gelo Tradicional', category: 'Gelo / água', quantity: 10 },
  { id: 'adega-mqogtkqg-fj5xg', name: 'Gin Apogee', category: 'Gin', quantity: 1 },
  { id: 'adega-mqohg9u9-ojrg4', name: "Jack Daniel's Tennessee Honey", category: 'Licor', quantity: 1 },
  { id: 'adega-mqogzjgi-i87ze', kind: 'ingredient', name: 'Limão', category: 'Fruta', quantity: 5 },
  { id: 'adega-mqjk7b02-mrted', name: 'Martini Extra Dry', category: 'Vermouth', quantity: 1 },
  { id: 'adega-mqohc2j4-ida5t', name: 'Pisco Reservado Capel', category: 'Pisco', quantity: 1 },
  { id: 'adega-mqjk7b10-schga', kind: 'ingredient', name: 'Schweppes Ginger Ale', category: 'Refrigerante / mixer', quantity: 1 },
  { id: 'adega-mqjk7b09-schtr', kind: 'ingredient', name: 'Schweppes Tônica Rosé', category: 'Refrigerante / mixer', quantity: 1 },
  { id: 'adega-mqoh6kic-cb1nk', name: 'Smirnoff Vodka', category: 'Vodka', quantity: 1 },
  { id: 'adega-mqjk7b06-stcbl', name: 'Stock Curaçao Blue', category: 'Licor', quantity: 1 },
  { id: 'adega-mqogsfsi-lha3s', name: 'Whisky Jack Daniels', category: 'Whisky', quantity: 1 },
  { id: 'adega-mqobjxx4-r9tq8', name: 'Whisky Royal Salute The Rio de Janeiro Polo Edition', category: 'Whisky', quantity: 1 },
  { id: 'adega-mqu8da1d-cw5hz', name: 'Contini', category: 'Vermouth', quantity: 1 },
  { id: 'adega-mqu8f6lj-dm1kn', name: 'Azuma Soft', category: 'Sake', quantity: 1 },
];

const store = {
  overrides: {},
  customDrinks: [
    {
      slug: 'gin-tonic',
      title: 'Gin Tonic',
      tagline: 'Gin, tônica e limão — seco, refrescante e direto ao ponto.',
      imageUrl: '/img/personal/drinks/thumbs/gin-tonic.jpg',
      ingredients: ['50ml de Gin', '150ml de Refrigerante tônica', 'Gelo', '1 rodela de limão'],
      steps: ['Gele o copo;', 'Acrescente o gin;', 'Complete com tônica;', 'Decore com limão.'],
      notes: 'Drink misturado (não batido)!',
    },
  ],
};

const catalogSlugs = new Set(VINICIUS_DRINKS.map((d) => d.slug));
const existingSlugs = new Set(catalogSlugs);
for (const drink of store.customDrinks ?? []) existingSlugs.add(drink.slug);

const suggestions = getNewDrinkSuggestions(existingSlugs, adegaItems);
const ready = suggestions.filter((s) => s.match.status === 'ready');

console.log('Ready suggestions:', ready.length);
for (const { drink, match } of ready) {
  console.log(`  ${drink.slug} — ${drink.title} (${drink.imageUrl})`);
}

const partial = suggestions.filter((s) => s.match.status === 'partial').slice(0, 8);
console.log('\nPartial (sample):');
for (const { drink, match } of partial) {
  console.log(`  ${drink.slug}: ${match.missingLabels.join(', ')}`);
}
