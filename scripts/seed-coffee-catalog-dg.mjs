/**
 * Gera/atualiza metadados do catálogo Dolce Gusto a partir da listagem pública.
 * Imagens exigem scrape por produto (scripts/scrape-coffee-capsule-images.mjs).
 *
 * Uso: node scripts/seed-coffee-catalog-dg.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/coffeeCapsuleCatalog/dolce-gusto.json');

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Metadados extraídos de nescafe-dolcegusto.com.br/sabores (jun/2026). */
const DG_PRODUCTS = [
  ['MOÇA PISTACCHIO LATTE', null, 'Cremoso & Equilibrado', 'lattes'],
  ['STARBUCKS Espresso Colombia', 7, 'Uma viagem de sabor', 'starbucks'],
  ['ESPRESSO', 5, 'Delicado e frutado', 'cafes'],
  ['ESPRESSO DESCAFEINADO', 5, 'Saboroso e agradável', 'cafes'],
  ['ESPRESSO INTENSO', 7, 'Energético e aromático', 'cafes'],
  ['DOPPIO ESPRESSO', 10, 'Rico e Intenso', 'cafes'],
  ['ESPRESSO BARISTA', 9, 'Poderoso e saboroso', 'cafes'],
  ['CAFFÈ MATINAL', 9, 'Aromático e Intenso', 'cafes'],
  ['LUNGO', 6, 'Equilibrado e torrado', 'cafes'],
  ['CAFÉ CASEIRO', 6, 'Suave e Saboroso', 'cafes'],
  ['CAFÉ CASEIRO INTENSO', 8, 'Encorpado e Saboroso', 'cafes'],
  ['KOPENHAGEN ESPRESSO', 5, 'O sabor da cafeteria', 'cafes'],
  ['LUNGO CHAPADA DIAMANTINA', 6, 'Com a alma da Chapada', 'cafes'],
  ['ESPRESSO NESCAFÉ GOLD', 6, 'Equilibrado e Intenso', 'cafes'],
  ['LUNGO NESCAFÉ GOLD', 8, 'Equilibrado e Intenso', 'cafes'],
  ['ESPRESSO CERRADO MINEIRO', 8, 'Muito sabor num só café', 'cafes'],
  ['ORIGENS DO MUNDO BRASIL ORGÂNICO', 5, 'Sabor orgânico do Brasil', 'cafes'],
  ['ESPRESSO SERRAS DO ALTO PARANAÍBA', 5, 'Das montanhas de Minas', 'cafes'],
  ['STARBUCKS Espresso Roast', 11, 'Um clássico Starbucks', 'starbucks'],
  ['STARBUCKS Americano House Blend', 8, 'Um clássico equilibrado', 'starbucks'],
  ['SHAKERATO', null, 'Refrescante', 'cafes'],
  ['MOCHACCINO CANELA', null, 'Único e cremoso', 'lattes'],
  ['CAPPUCCINO', null, 'Extra Cremoso', 'lattes'],
  ['CAFÉ AU LAIT', null, 'Equilibrado e encorpado', 'lattes'],
  ['CAFÉ AU LAIT DESNATADO', null, 'Equilibrado e cremoso', 'lattes'],
  ['CAFÉ AU LAIT VANILLA', null, 'Equilibrado e aromático', 'lattes'],
  ['CORTADO', null, 'Forte e torrado', 'cafes'],
  ['PINGADO', null, 'Tradição é tradição', 'lattes'],
  ['MOCHACCINO AVELÃ', null, 'Café, cacau e sabor avelã', 'lattes'],
  ['LATTE MACCHIATO', null, 'Delicado e Cremoso', 'lattes'],
  ['VANILLA LATTE MACCHIATO', null, 'Delicado e encorpado', 'lattes'],
  ['FRAPPE', null, 'Cremoso e refrescante', 'lattes'],
  ['CAPPUCCINO MOÇA DOCE DE LEITE', null, 'Denso e adocicado', 'lattes'],
  ['KOPENHAGEN CAPPUCCINO', null, 'Um clássico Kopenhagen', 'lattes'],
  ['KOPENHAGEN LAJOTINHA', null, 'Encorpado e delicioso', 'lattes'],
  ['STARBUCKS Cappuccino', null, 'Rico e cremoso', 'starbucks'],
  ['STARBUCKS Caramel Macchiato', null, 'Doce, cremoso e único', 'starbucks'],
  ['KOPENHAGEN LÍNGUA DE GATO', null, 'Com sabor do chocolate', 'lattes'],
  ['GALAK', null, 'Cremoso e aveludado', 'chocolates'],
  ['NESCAU', null, 'Cremoso e Saboroso', 'chocolates'],
  ['CHOCOCINO NESTLÉ', null, 'Intenso e delicioso', 'chocolates'],
  ['NESQUIK', null, 'Docinho e cremoso', 'chocolates'],
  ['CHAI TEA LATTE', null, 'Seleção de especiarias', 'chas'],
  ["NATURE'S HEART HIBISCUS PINK LEMONADE", null, 'Para refrescar', 'chas'],
  ['NESTEA PÊSSEGO', null, 'Saboroso e refrescante', 'chas'],
  ["NATURE'S HEART ZEN STYLE", null, 'Para equilibrar', 'chas'],
  ['NEO Espresso Delicate', 5, 'Café NEO delicado', 'neo'],
  ['NEO Espresso Serras do Alto Paranaíba', 7, 'Café NEO serras', 'neo'],
  ['NEO Lungo Chapada Diamantina', 7, 'Café NEO lungo', 'neo'],
  ['CARAMELO SALGADO', null, 'Encorpado e Delicioso', 'lattes'],
  ['CHOCOCINO ALPINO', null, 'Cremoso e denso', 'chocolates'],
  ['KITKAT', null, 'O sabor oficial do break', 'chocolates'],
  ['NESTEA MATE LIMÃO', null, 'Cítrico e refrescante', 'chas'],
  ['NEO Espresso Sul de Minas Orgânico', 6, 'Café NEO orgânico', 'neo'],
];

function inferBrand(name) {
  if (/starbucks/i.test(name)) return 'Starbucks';
  if (/kopenhagen/i.test(name)) return 'Kopenhagen';
  if (/neo /i.test(name)) return 'NEO';
  if (/nescafé|nescau|nesquik|nestea|nestlé|galak|kitkat/i.test(name)) return 'Nestlé';
  if (/moça|moçaccino/i.test(name)) return 'Moça';
  if (/nature's heart/i.test(name)) return "Nature's Heart";
  return 'Nescafé Dolce Gusto';
}

function inferCupSize(name) {
  const n = name.toLowerCase();
  if (/\blungo\b/.test(n)) return 'lungo';
  if (/\bespresso\b|\bcortado\b|\bdoppio\b|\bristretto\b/.test(n)) return 'espresso';
  if (/\blatte\b|\bcappuccino\b|\bmacchiato\b|\bau lait\b|\bpingado\b|\bmochaccino\b/.test(n))
    return 'regular';
  return 'espresso';
}

const starbucksColombiaImages = {
  box: '/img/personal/coffee/catalog/dolce-gusto/starbucks-espresso-colombia/box.jpg',
  capsule: '/img/personal/coffee/catalog/dolce-gusto/starbucks-espresso-colombia/capsule.jpg',
};

const entries = DG_PRODUCTS.map(([name, intensity, flavorNotes]) => {
  const slug = slugify(name);
  const isColombia = slug === 'starbucks-espresso-colombia';
  return {
    slug,
    system: 'dolce-gusto',
    name: name.replace(/^STARBUCKS\s+/i, '').replace(/10 CÁPSULAS?/i, '').trim(),
    brand: inferBrand(name),
    intensity: intensity ?? undefined,
    packSize: 10,
    cupSize: inferCupSize(name),
    cupVolumeMl: inferCupSize(name) === 'lungo' ? 110 : inferCupSize(name) === 'espresso' ? 30 : undefined,
    flavorNotes,
    description: isColombia
      ? 'Beba e saboreie esta origem única da Colômbia, equilibrada, sabor suculento e final característico de nozes. Criado para máquinas NESCAFÉ Dolce Gusto.'
      : undefined,
    ingredients: isColombia ? 'Café torrado e moído. Contém 10 cápsulas.' : undefined,
    origin: isColombia ? 'Colômbia' : undefined,
    coffeeType: isColombia ? '100% Arábica' : undefined,
    priceReference: isColombia ? 17.9 : undefined,
    catalogUrl: 'https://www.nescafe-dolcegusto.com.br/sabores',
    images: isColombia ? starbucksColombiaImages : {},
    imagesPending: !isColombia,
  };
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(entries, null, 2), 'utf8');
console.log(`Wrote ${entries.length} Dolce Gusto entries → ${OUT}`);
