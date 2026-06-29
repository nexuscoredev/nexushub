/**
 * Baixa imagens em falta no catálogo TRES (URLs corrigidas + overrides manuais).
 * node scripts/patch-tres-missing-images.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_FILE = join(ROOT, 'src/data/coffeeCapsuleCatalog/tres-coracoes.json');
const MANIFEST_FILE = join(__dirname, 'coffee-image-manifest.json');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog/tres-coracoes');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const IMG_RE = /https:\/\/mercafefaststore\.vtexassets\.com\/arquivos\/ids\/\d+\/[^"'\s]+\.(?:png|jpe?g|webp)(?:\?[^"'\s]*)?/gi;

/** URLs confirmadas (VTEX / CDN Mercafé). */
const MANUAL_PATCHES = [
  {
    slug: 'cappuccino-doce-de-leite-havanna',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cappuccino-doce-de-leite-havanna-tres/p',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/552545/CAPPUCCINO-HAVANNA.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553710/CAPSULA-CAPPUCCINO-HAVANNA.png',
  },
  {
    slug: 'cha-maca-verde-cranberry',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cha-maca-verde-com-cranberry-tres-3cha/p',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/537149/CHA_Maca_1000x1000_2.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553700/Cha-de-Maca-Verde-com-Cranberry_.png',
  },
  {
    slug: 'espresso-regioes-congo',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-congo-tres/p',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553465/CONGO.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553466/CAPSULA-CONGO.png',
  },
  {
    slug: 'espresso-regioes-india',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-regioes-do-mundo-india-tres/p',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553467/INDIA.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553474/CAPSULA-INDIA.png',
  },
  {
    slug: 'espresso-regioes-mexico',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553471/MEXICO.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553472/CAPSULA-MEXICO.png',
  },
  {
    slug: 'espresso-rituais-mogiana-paulista',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/',
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/556793/RITUAIS_CARTUCHO_MOGIANA.png.png',
    capsule: 'https://mercafefaststore.vtexassets.com/arquivos/ids/556794/RITUAIS_CAPSULA_MOGIANA.png.png',
  },
];

const SCRAPE_PATCHES = [
  {
    slug: 'cha-verde-limao-gengibre',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cha-verde-limao-e-gengibre-tres/p',
  },
  {
    slug: 'cha-laranja-mediterranea-hibisco',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cha-laranja-mediterranea-com-hibisco-tres-3cha/p',
    capsuleHint: /Capsula-de-Cha|Cha-de-Laranja-Mediterranea-com-Hibisco/i,
    boxHint: /CHA_Laranja|Cha-de-Laranja(?!.*Capsula)/i,
  },
];

function extractImages(html, patch) {
  const urls = [...new Set([...html.matchAll(IMG_RE)].map((m) => m[0]))].filter(
    (u) => !/BPA|cadastro|\/42\./i.test(u),
  );
  const capsule =
    urls.find((u) => patch.capsuleHint?.test(u)) ??
    urls.find((u) => /\/CAPSULA[-_]/i.test(u) || /Capsula-de-/i.test(u)) ??
    null;
  const box =
    urls.find((u) => patch.boxHint?.test(u)) ??
    urls.find((u) => !/capsul/i.test(u) && !/Capsula-de-/i.test(u)) ??
    null;
  return { box, capsule };
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
}

const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));

for (const patch of [...MANUAL_PATCHES, ...SCRAPE_PATCHES]) {
  process.stdout.write(`${patch.slug}… `);

  let remote = { box: patch.box ?? null, capsule: patch.capsule ?? null };
  if (!remote.box || !remote.capsule) {
    const r = await fetch(patch.catalogUrl, { headers: { 'User-Agent': UA } });
    if (!r.ok) {
      console.log(`✗ HTTP ${r.status}`);
      continue;
    }
    remote = extractImages(await r.text(), patch);
  }

  if (!remote.box || !remote.capsule) {
    console.log('✗ incompleto', remote);
    continue;
  }

  const outDir = join(IMG_ROOT, patch.slug);
  await download(remote.box, join(outDir, 'box.jpg'));
  await download(remote.capsule, join(outDir, 'capsule.jpg'));
  await normalizeCoffeeCapsuleImage(join(outDir, 'capsule.jpg'), `tres-coracoes/${patch.slug}`);

  const entry = catalog.find((e) => e.slug === patch.slug);
  if (entry) {
    entry.catalogUrl = patch.catalogUrl;
    entry.images = {
      box: `/img/personal/coffee/catalog/tres-coracoes/${patch.slug}/box.jpg`,
      capsule: `/img/personal/coffee/catalog/tres-coracoes/${patch.slug}/capsule.jpg`,
    };
    entry.imagesPending = false;
  }

  const man = manifest['tres-coracoes'].find((e) => e.slug === patch.slug);
  if (man) {
    man.box = remote.box;
    man.capsule = remote.capsule;
    man.catalogUrl = patch.catalogUrl;
  }

  console.log('✓');
}

writeFileSync(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Patch concluído.');
