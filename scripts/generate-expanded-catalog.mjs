/**
 * Gera nespresso.json expandido + atualiza tres-coracoes.json
 * node scripts/generate-expanded-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG = join(__dirname, '../src/data/coffeeCapsuleCatalog');

const extracted = JSON.parse(readFileSync('scripts/_nespresso-br-extracted.json', 'utf8'));

const LEGACY_SLUG = {
  'stockholm-lungo': 'fortissio-lungo',
  'tokyo-lungo': 'vivalto-lungo',
  'vienna-lungo': 'linizio-lungo',
};

const LEGACY_NAMES = {
  'fortissio-lungo': 'Fortissio Lungo',
  'vivalto-lungo': 'Vivalto Lungo',
  'linizio-lungo': 'Linizio Lungo',
};

const OLD = JSON.parse(readFileSync(join(CATALOG, 'nespresso.json'), 'utf8'));
const oldBySlug = Object.fromEntries(OLD.map((e) => [e.slug, e]));

function cupVolume(cupSize) {
  if (cupSize === 'ristretto') return 25;
  if (cupSize === 'lungo') return 110;
  if (cupSize === 'regular') return 180;
  return 40;
}

const nespressoCaps = extracted
  .filter((e) => !e.slug.startsWith('kit-'))
  .map((raw) => {
    const slug = LEGACY_SLUG[raw.slug] ?? raw.slug;
    const name = LEGACY_NAMES[slug] ?? raw.name.trim();
    const prev = oldBySlug[slug];
    return {
      slug,
      system: 'nespresso',
      name,
      brand: 'Nespresso',
      ...(raw.intensity != null && raw.intensity > 0 ? { intensity: raw.intensity } : {}),
      packSize: 10,
      cupSize: raw.cupSize,
      cupVolumeMl: cupVolume(raw.cupSize),
      flavorNotes: raw.headline || prev?.flavorNotes,
      description: prev?.description,
      coffeeType: prev?.coffeeType,
      catalogUrl: raw.catalogUrl ?? prev?.catalogUrl ?? 'https://www.nespresso.com/br/pt/order/capsules/original',
      images: {
        box: `/img/personal/coffee/catalog/nespresso/${slug}/box.jpg`,
        capsule: `/img/personal/coffee/catalog/nespresso/${slug}/capsule.jpg`,
      },
      imagesPending: false,
    };
  });

const tres3cCompat = [
  {
    slug: '3c-espresso-intenso',
    name: 'Espresso Intenso',
    intensity: 9,
    flavorNotes: 'Encorpado e intenso',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-intenso/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-intenso.png',
    capsule: null,
  },
  {
    slug: '3c-cerrado-mineiro',
    name: 'Espresso Cerrado Mineiro',
    intensity: 8,
    flavorNotes: 'Chocolate amargo e acidez média',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-cerrado-mineiro/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-cerrado-mineiro-1.png',
    capsule: null,
  },
  {
    slug: '3c-mogiana-paulista',
    name: 'Espresso Mogiana Paulista',
    intensity: 7,
    flavorNotes: 'Corpo aveludado e floral',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-mogiana-paulista/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-mogiana-paulista.png',
    capsule: null,
  },
  {
    slug: '3c-organico',
    name: 'Espresso Orgânico',
    intensity: 5,
    flavorNotes: 'Suave e equilibrado',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-organico/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-organico.png',
    capsule: null,
  },
  {
    slug: '3c-descafeinado',
    name: 'Espresso Descafeinado',
    flavorNotes: 'Sabor de café, mínimo de cafeína',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-descafeinado/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/05/capsula-compativel-nespresso-3-coracoes-descafeinado.png',
    capsule: null,
  },
  {
    slug: '3c-maximo',
    name: 'Espresso Máximo',
    intensity: 13,
    flavorNotes: 'Máxima intensidade, madeira e chocolate amargo',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-maximo/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-intensidade-maxima.png',
    capsule: null,
  },
  {
    slug: '3c-regioes-peru',
    name: 'Espresso Regiões do Mundo Peru',
    intensity: 6,
    flavorNotes: 'Caramelo, cacau e especiarias',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-peru/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-peru.png',
    capsule: null,
  },
  {
    slug: '3c-regioes-colombia',
    name: 'Espresso Regiões do Mundo Colômbia',
    intensity: 7,
    flavorNotes: 'Chocolate adocicado e acidez delicada',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-colombia/',
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsulas-compativeis-colombia.png',
    capsule: null,
  },
].map((p) => ({
  slug: p.slug,
  system: 'nespresso',
  name: p.name,
  brand: 'Três Corações',
  ...(p.intensity != null ? { intensity: p.intensity } : {}),
  packSize: 10,
  cupSize: 'espresso',
  cupVolumeMl: 40,
  flavorNotes: p.flavorNotes,
  catalogUrl: p.catalogUrl,
  images: {
    box: `/img/personal/coffee/catalog/nespresso/${p.slug}/box.jpg`,
    capsule: `/img/personal/coffee/catalog/nespresso/${p.slug}/capsule.jpg`,
  },
  imagesPending: false,
  _remote: { box: p.box, capsule: p.capsule },
}));

// Dedupe nespresso by slug
const bySlug = new Map();
for (const e of [...nespressoCaps, ...tres3cCompat]) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
}
const nespressoFinal = [...bySlug.values()].sort((a, b) => {
  const brand = (a.brand ?? '').localeCompare(b.brand ?? '');
  if (brand !== 0) return brand;
  return (b.intensity ?? 0) - (a.intensity ?? 0) || a.name.localeCompare(b.name);
});

writeFileSync(join(CATALOG, 'nespresso.json'), JSON.stringify(nespressoFinal, null, 2) + '\n');
console.log('nespresso.json →', nespressoFinal.length, 'produtos');

// TRES system
const tresOld = JSON.parse(readFileSync(join(CATALOG, 'tres-coracoes.json'), 'utf8'));
const tresNew = [
  ...tresOld,
  {
    slug: 'cafe-filtrado',
    system: 'tres-coracoes',
    name: 'Café Filtrado',
    brand: 'Três Corações',
    packSize: 10,
    cupSize: 'regular',
    cupVolumeMl: 180,
    flavorNotes: 'Café filtrado na Solução TRES',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cafe-filtrado/',
    images: {
      box: '/img/personal/coffee/catalog/tres-coracoes/cafe-filtrado/box.jpg',
      capsule: '/img/personal/coffee/catalog/tres-coracoes/cafe-filtrado/capsule.jpg',
    },
    imagesPending: false,
  },
  {
    slug: 'cha-hibisco-maca',
    system: 'tres-coracoes',
    name: 'Chá Hibisco e Maçã',
    brand: 'Três Corações',
    packSize: 10,
    cupSize: 'regular',
    flavorNotes: 'Chá aromático hibisco e maçã',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cha-hibisco-e-maca/',
    images: {
      box: '/img/personal/coffee/catalog/tres-coracoes/cha-hibisco-maca/box.jpg',
      capsule: '/img/personal/coffee/catalog/tres-coracoes/cha-hibisco-maca/capsule.jpg',
    },
    imagesPending: false,
  },
].filter((n) => !tresOld.some((o) => o.slug === n.slug));

writeFileSync(
  join(CATALOG, 'tres-coracoes.json'),
  JSON.stringify([...tresOld, ...tresNew], null, 2) + '\n',
);
console.log('tres-coracoes.json →', tresOld.length + tresNew.length, 'produtos');

// Image map for manifest builder
const imageMap = {
  nespresso: Object.fromEntries(
    extracted
      .filter((e) => !e.slug.startsWith('kit-'))
      .map((e) => {
        const slug = LEGACY_SLUG[e.slug] ?? e.slug;
        const name = LEGACY_NAMES[slug] ?? e.name.trim();
        return [name, e._imageUrl];
      }),
  ),
  tres3c: Object.fromEntries(tres3cCompat.map((p) => [p.name, { box: p._remote.box, capsule: p._remote.capsule }])),
  tresExtra: {
    'Café Filtrado': {
      box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cafe-filtrado-3-coracoes.png',
      capsule:
        'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cafe-filtrado-3-coracoes-02.png',
    },
    'Chá Hibisco e Maçã': {
      box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-cha-tres-hibisco-maca-3-coracoes.png',
      capsule:
        'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-cha-tres-hibisco-maca-3-coracoes-02.png',
    },
  },
};

writeFileSync('scripts/_catalog-image-map.json', JSON.stringify(imageMap, null, 2));
console.log('Wrote scripts/_catalog-image-map.json');
