/**
 * Extrai cápsulas Original da PLP Nespresso BR e gera entradas de catálogo.
 * node scripts/extract-nespresso-br-catalog.mjs
 */
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const PLP = 'https://www.nespresso.com/br/pt/order/capsules/original';

const html = await fetch(PLP, { headers: { 'User-Agent': UA } }).then((r) => r.text());

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cupSizeFromRanges(cupSizes = []) {
  const joined = cupSizes.join(' ');
  if (/lungo/i.test(joined) || /110|lungo/.test(joined)) return 'lungo';
  if (/ristretto/i.test(joined)) return 'ristretto';
  return 'espresso';
}

function cupVolumeMl(cupSize) {
  if (cupSize === 'ristretto') return 25;
  if (cupSize === 'lungo') return 110;
  return 40;
}

const products = [];
const re =
  /\{"id":"erp\.br\.b2c\/prod\/[^"]+","internationalId":"[^"]+","legacyId":"[^"]+","name":"([^"]+)","internationalName":"([^"]*)"(?:,"description":[^,]+)?,"image":\{"url":"([^"]+)"[^}]*\}[^}]*"type":"capsule"[^}]*"headline":"([^"]*)"[^}]*"url":"([^"]+)"[^}]*"intensity":(\d+|null)[^}]*"ranges":\[([^\]]*)\][^}]*"cupSizes":\[([^\]]*)\]/g;

let m;
while ((m = re.exec(html)) !== null) {
  const [, name, internationalName, imageUrl, headline, urlPath, intensityRaw, , cupSizesRaw] = m;
  const cupSize = cupSizeFromRanges([cupSizesRaw]);
  products.push({
    name,
    internationalName,
    imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.nespresso.com${imageUrl}`,
    headline,
    url: urlPath.startsWith('http') ? urlPath : `https://www.nespresso.com${urlPath}`,
    intensity: intensityRaw === 'null' ? undefined : Number(intensityRaw),
    cupSize,
  });
}

console.log('Extracted', products.length, 'capsules');
if (products.length === 0) {
  console.error('No products — regex may need update');
  process.exit(1);
}

const existingSlugs = new Set([
  'ristretto', 'arpeggio', 'roma', 'livanto', 'capriccio', 'cosi', 'volluto',
  'napoli', 'kazaar', 'fortissio-lungo', 'vivalto-lungo', 'linizio-lungo',
]);

const entries = products.map((p) => {
  let slug = slugify(p.name);
  // Keep legacy slugs for products already in catalog
  const legacyMap = {
    Ristretto: 'ristretto',
    Arpeggio: 'arpeggio',
    Roma: 'roma',
    Livanto: 'livanto',
    Capriccio: 'capriccio',
    Cosi: 'cosi',
    Volluto: 'volluto',
    Napoli: 'napoli',
    Kazaar: 'kazaar',
    'Fortissio Lungo': 'fortissio-lungo',
    'Vivalto Lungo': 'vivalto-lungo',
    'Linizio Lungo': 'linizio-lungo',
    'Tokyo Vivalto Lungo': 'vivalto-lungo',
    'Stockholm Fortissio Lungo': 'fortissio-lungo',
    'Vienna Linizio Lungo': 'linizio-lungo',
  };
  if (legacyMap[p.name]) slug = legacyMap[p.name];

  return {
    slug,
    system: 'nespresso',
    name: p.name,
    brand: 'Nespresso',
    ...(p.intensity != null ? { intensity: p.intensity } : {}),
    packSize: 10,
    cupSize: p.cupSize,
    cupVolumeMl: cupVolumeMl(p.cupSize),
    flavorNotes: p.headline || undefined,
    catalogUrl: p.url,
    images: {
      box: `/img/personal/coffee/catalog/nespresso/${slug}/box.jpg`,
      capsule: `/img/personal/coffee/catalog/nespresso/${slug}/capsule.jpg`,
    },
    imagesPending: true,
    _imageUrl: p.imageUrl,
  };
});

// Dedupe by slug (keep first)
const bySlug = new Map();
for (const e of entries) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
}
const unique = [...bySlug.values()].sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0) || a.name.localeCompare(b.name));

writeFileSync('scripts/_nespresso-br-extracted.json', JSON.stringify(unique, null, 2));
console.log('Unique slugs', unique.length);
for (const e of unique) console.log(`  ${e.intensity ?? '—'}\t${e.slug}\t${e.name}`);
