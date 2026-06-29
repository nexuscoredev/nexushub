/**
 * Expande tres-coracoes.json (~42 SKUs Solução TRES) e atualiza coffee-image-manifest.
 * node scripts/expand-tres-coracoes-catalog.mjs
 * node scripts/expand-tres-coracoes-catalog.mjs --download
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_FILE = join(ROOT, 'src/data/coffeeCapsuleCatalog/tres-coracoes.json');
const MANIFEST_FILE = join(__dirname, 'coffee-image-manifest.json');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog/tres-coracoes');
const DOWNLOAD = process.argv.includes('--download');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** slug canônico → slug legado no repo (preserva estoque do utilizador). */
const LEGACY_SLUG = {
  'espresso-supremo': 'espresso-suave',
  'espresso-pleno': 'espresso-classico',
  'espresso-vibrante': 'lungo-intenso',
  'espresso-gourmet-dark-roast': 'espresso-ristretto',
  'cappuccino-classic': 'cappuccino-classico',
};

const TRES_PRODUCTS = [
  { slug: 'espresso-supremo', name: 'Espresso Supremo', intensity: 5, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Suave e aromático', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-supremo-tres/p' },
  { slug: 'espresso-pleno', name: 'Espresso Pleno', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Equilibrado', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-pleno-tres/p' },
  { slug: 'espresso-ameno', name: 'Espresso Ameno', intensity: 4, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-ameno-tres/p' },
  { slug: 'espresso-atento', name: 'Espresso Atento', intensity: 8, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-atento-tres/p' },
  { slug: 'espresso-vibrante', name: 'Espresso Vibrante', intensity: 7, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Vibrante e marcante', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-vibrante-tres/p' },
  { slug: 'espresso-forza', name: 'Espresso Forza', intensity: 10, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Intenso e encorpado', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-forza-tres/p', cafe3cUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cafe-espresso-forza/' },
  { slug: 'espresso-brasileiro', name: 'Espresso Brasileiro', intensity: 7, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-brasileiro-tres/p' },
  { slug: 'espresso-gourmet-dark-roast', name: 'Espresso Gourmet Dark Roast', intensity: 10, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Muito intenso', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-gourmet-dark-roast-tres/p' },
  { slug: 'espresso-gourmet-cerrado-mineiro', name: 'Espresso Gourmet Cerrado Mineiro', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-de-cafe-espresso-gourmet-cerrado-mineiro-tres-3-coracoes/p' },
  { slug: 'espresso-gourmet-chapada-diamantina', name: 'Espresso Gourmet Chapada Diamantina', intensity: 4, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-gourmet-chapada-diamantina-tres/p' },
  { slug: 'espresso-gourmet-mogiana-paulista', name: 'Espresso Gourmet Mogiana Paulista', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-de-cafe-espresso-gourmet-mogiana-paulista-tres-3-coracoes/p' },
  { slug: 'espresso-descafeinado', name: 'Espresso Descafeinado', intensity: 4, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-descafeinado-tres/p' },
  { slug: 'espresso-rituais-chocolate', name: 'Espresso Rituais Chocolate', intensity: 4, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-de-cafe-espresso-rituais-chocolate-tres-3-coracoes/p' },
  {
    slug: 'espresso-rituais-mogiana-paulista',
    name: 'Espresso Rituais Mogiana Paulista',
    intensity: 6,
    cupSize: 'espresso',
    cupVolumeMl: 50,
    flavorNotes: 'Descontinuado no Mercafé',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
  },
  { slug: 'espresso-rituais-exotico', name: 'Espresso Rituais Exótico', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-de-cafe-espresso-rituais-exotico-tres-3-coracoes/p' },
  { slug: 'espresso-portinari-peneirando', name: 'Espresso Portinari Peneirando Café', intensity: 5, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-portinari-peneirando-cafe-tres-3-coracoes/p' },
  { slug: 'espresso-portinari-meninos-soltando-pipa', name: 'Espresso Portinari Meninos Soltando Pipa', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-portinari-meninos-soltando-pipa-tres-3-coracoes/p' },
  { slug: 'espresso-regioes-colombia', name: 'Espresso Regiões do Mundo Colômbia', intensity: 7, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-colombia-tres/p' },
  { slug: 'espresso-regioes-congo', name: 'Espresso Regiões do Mundo Congo', intensity: 5, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-congo-tres/p' },
  { slug: 'espresso-regioes-india', name: 'Espresso Regiões do Mundo Índia', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-india-tres/p' },
  {
    slug: 'espresso-regioes-mexico',
    name: 'Espresso Regiões do Mundo México',
    intensity: 6,
    cupSize: 'espresso',
    cupVolumeMl: 50,
    flavorNotes: 'Descontinuado no Mercafé',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
  },
  { slug: 'iced-coffee-rituais', name: 'Iced Coffee Rituais', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-iced-coffee-rituais-3-coracoes/p' },
  { slug: 'cafe-filtrado', name: 'Café Filtrado', cupSize: 'regular', cupVolumeMl: 100, flavorNotes: 'Café filtrado na Solução TRES', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-filtrado-3-coracoes-tres/p', cafe3cUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cafe-filtrado/' },
  { slug: 'cafe-filtrado-gourmet', name: 'Café Filtrado Gourmet', intensity: 3, cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-filtrado-gourmet-tres/p' },
  { slug: 'cappuccino-classic', name: 'Cappuccino Classic', cupSize: 'regular', cupVolumeMl: 80, flavorNotes: 'Cremoso', catalogUrl: 'https://www.mercafe.com.br/capsula-cappuccino-classic-3-coracoes-tres/p', cafe3cUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cappuccino-classic/' },
  { slug: 'cappuccino-avela', name: 'Cappuccino Avelã', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-cappuccino-avela-tres/p' },
  { slug: 'cappuccino-doce-de-leite-havanna', name: 'Cappuccino Doce de Leite Havanna', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-cappuccino-doce-de-leite-havanna-tres/p' },
  { slug: 'chocolatto-classic', name: 'Chocolatto Classic', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-chocolatto-classic-tres/p' },
  { slug: 'chocolatto-caramello', name: 'Chocolatto Caramello', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-chocolatto-caramello-tres/p' },
  { slug: 'latte', name: 'Latte', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-latte-tres/p' },
  { slug: 'latte-macchiato', name: 'Latte Macchiato', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-latte-macchiato-tres/p' },
  { slug: 'cafe-com-leite', name: 'Café com Leite', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-com-leite-tres/p' },
  { slug: 'chai-latte', name: 'Chai Latte', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-chai-latte-tres/p' },
  { slug: 'baileys-supremo-macchiato', name: 'Baileys Supremo Macchiato', cupSize: 'regular', cupVolumeMl: 80, catalogUrl: 'https://www.mercafe.com.br/capsula-baileys-supremo-macchiato-tres/p' },
  { slug: 'cha-hibisco-maca', name: 'Chá Hibisco e Maçã', cupSize: 'regular', cupVolumeMl: 100, flavorNotes: 'Chá aromático hibisco e maçã', catalogUrl: 'https://www.mercafe.com.br/capsula-cha-hibisco-e-maca-tres/p', cafe3cUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cha-hibisco-e-maca/' },
  { slug: 'cha-verde-limao-gengibre', name: 'Chá Verde com Limão e Gengibre', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-verde-limao-e-gengibre-tres/p' },
  { slug: 'cha-erva-doce', name: 'Chá de Erva Doce', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-erva-doce-tres/p' },
  { slug: 'cha-camomila', name: 'Chá de Camomila', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-camomila-tres/p' },
  { slug: 'cha-hortela', name: 'Chá de Hortelã', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-hortela-tres/p' },
  { slug: 'cha-capim-cidreira', name: 'Chá de Capim Cidreira', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-capim-cidreira-tres/p' },
  { slug: 'cha-maca-verde-cranberry', name: 'Chá de Maçã Verde com Cranberry', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-maca-verde-com-cranberry-tres/p' },
  { slug: 'cha-laranja-mediterranea-hibisco', name: 'Chá de Laranja Mediterrânea com Hibisco', cupSize: 'regular', cupVolumeMl: 100, catalogUrl: 'https://www.mercafe.com.br/capsula-cha-laranja-mediterranea-com-hibisco-tres-3cha/p' },
  { slug: 'cappuccino-pacoca', name: 'Cappuccino Paçoca', cupSize: 'regular', cupVolumeMl: 80, flavorNotes: 'Cremoso com sabor de paçoca', catalogUrl: 'https://www.mercafe.com.br/capsula-de-cappuccino-pacoca-tres-3-coracoes/p' },
  { slug: 'cappuccino-napolitano', name: 'Cappuccino Napolitano', cupSize: 'regular', cupVolumeMl: 80, flavorNotes: 'Chocolate, morango e baunilha', catalogUrl: 'https://www.mercafe.com.br/capsula-de-cappuccino-napolitano-tres-3-coracoes/p' },
  { slug: 'espresso-robusta-amazonico', name: 'Espresso Robusta Amazônico', intensity: 9, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: '100% robusta da Amazônia', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-robusta-amazonico-tres/p' },
  { slug: 'espresso-gourmet-organico', name: 'Espresso Gourmet Orgânico', intensity: 5, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Café orgânico gourmet', catalogUrl: 'https://www.mercafe.com.br/capsula-de-cafe-espresso-gourmet-organico-tres-3-coracoes/p' },
  { slug: 'espresso-regioes-honduras', name: 'Espresso Regiões do Mundo Honduras', intensity: 6, cupSize: 'espresso', cupVolumeMl: 50, catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-honduras-tres/p' },
  { slug: 'espresso-star-wars-darth-vader', name: 'Espresso Star Wars Darth Vader', intensity: 10, cupSize: 'espresso', cupVolumeMl: 50, flavorNotes: 'Blend intenso edição Star Wars', catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-star-wars-darth-vader-tres/p' },
  { slug: 'cha-noites-tranquilas', name: 'Chá Noites Tranquilas', cupSize: 'regular', cupVolumeMl: 100, flavorNotes: 'Camomila e ervas para relaxar', catalogUrl: 'https://www.mercafe.com.br/capsula-de-cha-noites-tranquilas-tres-3cha/p' },
  {
    slug: 'espresso-reserva-santa-clara-chapada',
    name: 'Espresso Reserva da Família Chapada Diamantina',
    intensity: 4,
    cupSize: 'espresso',
    cupVolumeMl: 50,
    flavorNotes: 'Santa Clara — Chapada Diamantina',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-santa-clara-reserva-da-familia-chapada-diamantina/p',
  },
];

/** Produtos descontinuados no Mercafé — imagens fixas VTEX. */
const MERCAFE_OVERRIDES = {
  'espresso-regioes-mexico': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553471/MEXICO.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553472/CAPSULA-MEXICO.png',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
  },
  'espresso-rituais-mogiana-paulista': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/556793/RITUAIS_CARTUCHO_MOGIANA.png.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/556794/RITUAIS_CAPSULA_MOGIANA.png.png',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
  },
};

const CAFE3C_OVERRIDES = {
  'cafe-filtrado': {
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cafe-filtrado-3-coracoes.png',
    capsule: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cafe-filtrado-3-coracoes-02.png',
  },
  'cappuccino-classic': {
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cappuccino-3-coracoes.png',
    capsule: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cappuccino-3-coracoes-02.png',
  },
  'cha-hibisco-maca': {
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-cha-tres-hibisco-maca-3-coracoes.png',
    capsule: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-cha-tres-hibisco-maca-3-coracoes-02.png',
  },
};

function outputSlug(canonical) {
  return LEGACY_SLUG[canonical] ?? canonical;
}

function extractMercafeImages(html) {
  const raw = [
    ...html.matchAll(
      /https:\/\/mercafefaststore\.vtexassets\.com\/arquivos\/ids\/\d+\/[^"'\s)]+\.(?:png|jpe?g|webp)(?:\?[^"'\s)]*)?/gi,
    ),
  ].map((m) => m[0]);
  const urls = [...new Set(raw)].filter(
    (u) => !/\/(?:BPA|cadastro-cartucho|42)\./i.test(u) && !/\/unsafe\//i.test(u),
  );
  const capsule =
    urls.find((u) => /\/CAPSULA[-_]/i.test(u) && !/C-CAPSULA/i.test(u)) ??
    urls.find((u) => /Capsula-de-/i.test(u)) ??
    urls.find((u) => /Cha-de-.*Hibisco/i.test(u)) ??
    null;
  const box =
    urls.find((u) => !/capsul/i.test(u) && /\.(png|jpe?g|webp)/i.test(u)) ??
    urls.find((u) => /C-CAPSULA/i.test(u)) ??
    null;
  return { box, capsule };
}

function extractCafe3cImages(html) {
  const imgs = [
    ...html.matchAll(/https?:\/\/www\.cafe3coracoes\.com\.br\/wp-content\/uploads\/[^"'\s)]+\.(?:png|jpe?g|webp)/gi),
  ].map((m) => m[0]);
  const unique = [...new Set(imgs)].filter((u) => /capsula/i.test(u));
  const capsule = unique.find((u) => /-02\.(png|jpe?g)/i.test(u)) ?? null;
  const box = unique.find((u) => !/-02\.(png|jpe?g)/i.test(u)) ?? null;
  return { box, capsule };
}

async function fetchProductImages(product) {
  const mercafeStatic = MERCAFE_OVERRIDES[product.slug];
  if (mercafeStatic) {
    return {
      box: mercafeStatic.box,
      capsule: mercafeStatic.capsule,
      catalogUrl: mercafeStatic.catalogUrl ?? product.catalogUrl,
    };
  }

  const override = CAFE3C_OVERRIDES[product.slug];
  if (override) return { ...override, catalogUrl: product.cafe3cUrl ?? product.catalogUrl };

  let box = null;
  let capsule = null;

  if (product.cafe3cUrl) {
    const r3 = await fetch(product.cafe3cUrl, { headers: { 'User-Agent': UA } });
    if (r3.ok) {
      const hit = extractCafe3cImages(await r3.text());
      box = hit.box;
      capsule = hit.capsule;
    }
  }

  if (product.catalogUrl) {
    const r = await fetch(product.catalogUrl, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const hit = extractMercafeImages(await r.text());
      box = box ?? hit.box;
      capsule = capsule ?? hit.capsule;
    }
  }

  return { box, capsule, catalogUrl: product.catalogUrl };
}

async function downloadBinary(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.byteLength < 800) throw new Error(`muito pequeno (${buf.byteLength} B)`);
  writeFileSync(dest, buf);
  return buf.byteLength;
}

function catalogEntry(product, slug, remote) {
  return {
    slug,
    system: 'tres-coracoes',
    name: product.name,
    brand: 'Três Corações',
    ...(product.intensity != null ? { intensity: product.intensity } : {}),
    packSize: 10,
    cupSize: product.cupSize,
    ...(product.cupVolumeMl != null ? { cupVolumeMl: product.cupVolumeMl } : {}),
    ...(product.flavorNotes ? { flavorNotes: product.flavorNotes } : {}),
    catalogUrl: remote.catalogUrl ?? product.catalogUrl,
    images: {
      box: `/img/personal/coffee/catalog/tres-coracoes/${slug}/box.jpg`,
      capsule: `/img/personal/coffee/catalog/tres-coracoes/${slug}/capsule.jpg`,
    },
    imagesPending: !(remote.box && remote.capsule),
    ...(remote.box || remote.capsule
      ? { _remote: { box: remote.box, capsule: remote.capsule } }
      : {}),
  };
}

const imageCache = new Map();
const entries = [];
let ok = 0;
let partial = 0;
let fail = 0;

for (const product of TRES_PRODUCTS) {
  const slug = outputSlug(product.slug);
  process.stdout.write(`${product.name}… `);

  let remote = imageCache.get(product.slug);
  if (!remote) {
    remote = await fetchProductImages(product);
    imageCache.set(product.slug, remote);
    await new Promise((r) => setTimeout(r, 250));
  }

  const entry = catalogEntry(product, slug, remote);
  entries.push(entry);

  if (remote.box && remote.capsule) {
    ok++;
    console.log('✓');
  } else if (remote.box || remote.capsule) {
    partial++;
    console.log('◐', remote.box ? '' : 'sem box', remote.capsule ? '' : 'sem capsule');
  } else {
    fail++;
    console.log('✗ sem imagem');
  }

  if (DOWNLOAD && remote.box) {
    const outDir = join(IMG_ROOT, slug);
    try {
      await downloadBinary(remote.box, join(outDir, 'box.jpg'));
      const capUrl = remote.capsule ?? remote.box;
      await downloadBinary(capUrl, join(outDir, 'capsule.jpg'));
      await normalizeCoffeeCapsuleImage(join(outDir, 'capsule.jpg'), `tres-coracoes/${slug}`);
      entry.imagesPending = false;
    } catch (err) {
      console.warn(`  download ${slug}: ${err.message}`);
    }
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const clean = entries.map(({ _remote, ...rest }) => rest);
writeFileSync(CATALOG_FILE, `${JSON.stringify(clean, null, 2)}\n`);

const manifest = existsSync(MANIFEST_FILE)
  ? JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'))
  : {};
manifest['tres-coracoes'] = entries.map((e) => {
  const remote = imageCache.get(
    Object.entries(LEGACY_SLUG).find(([, v]) => v === e.slug)?.[0] ?? e.slug,
  ) ?? { box: null, capsule: null };
  const src = TRES_PRODUCTS.find((p) => outputSlug(p.slug) === e.slug);
  const cached = imageCache.get(src?.slug ?? e.slug) ?? remote;
  return {
    slug: e.slug,
    name: e.name,
    box: cached.box,
    capsule: cached.capsule,
    catalogUrl: e.catalogUrl,
  };
});
writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\nCatálogo: ${clean.length} produtos (${ok} com box+capsule, ${partial} parcial, ${fail} sem imagem)`);
console.log('Wrote', CATALOG_FILE);
console.log('Updated', MANIFEST_FILE);
