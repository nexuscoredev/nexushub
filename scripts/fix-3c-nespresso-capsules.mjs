/**
 * Corrige imagens dos compatíveis 3C (Nespresso) via Mercafé PDP.
 * node scripts/fix-3c-nespresso-capsules.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog/nespresso');
const MANIFEST_FILE = join(__dirname, 'coffee-image-manifest.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const IMG_RE = /https:\/\/mercafefaststore\.vtexassets\.com\/arquivos\/ids\/\d+\/[^"'\s]+\.(?:png|jpe?g|webp)(?:\?[^"'\s]*)?/gi;

const PRODUCTS = [
  { slug: '3c-espresso-intenso', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-intenso/' },
  { slug: '3c-cerrado-mineiro', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-cerrado-mineiro/' },
  { slug: '3c-mogiana-paulista', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-mogiana-paulista/' },
  { slug: '3c-organico', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-organico/' },
  { slug: '3c-descafeinado', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-descafeinado/' },
  { slug: '3c-maximo', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-maximo/' },
  { slug: '3c-regioes-peru', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-peru/' },
  { slug: '3c-regioes-colombia', page: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-colombia/' },
];

function pickCompatImages(urls) {
  const list = [...new Set(urls)].filter((u) => !/BPA|cadastro|\/42\./i.test(u));
  let capsule =
    list.find((u) => /\/CAPSULA[-_]/i.test(u)) ??
    list.find((u) => /Capsula-de-/i.test(u)) ??
    list.find((u) => /COMPATIVEL_[A-Z0-9_]+_1\./i.test(u)) ??
    list.find((u) => /capsula-compativel/i.test(u) && !/_2\./i.test(u)) ??
    null;
  let box =
    list.find((u) => /COMPATIVEL_[A-Z0-9_]+_2\./i.test(u)) ??
    list.find((u) => !/capsul/i.test(u) && /COMPATIVEL/i.test(u)) ??
    list.find((u) => !/capsul/i.test(u)) ??
    null;

  if (!capsule) {
    const numeric = list.filter((u) => /\/\d+\.png/i.test(u));
    if (numeric.length >= 2) {
      const sorted = [...numeric].sort((a, b) => {
        const na = Number(a.match(/\/(\d+)\.png/i)?.[1] ?? 0);
        const nb = Number(b.match(/\/(\d+)\.png/i)?.[1] ?? 0);
        return na - nb;
      });
      capsule = sorted[0];
      box = box ?? sorted[sorted.length - 1];
    }
  }

  return { box, capsule };
}

async function resolveMercafeImages(pageUrl) {
  const pageHtml = await (await fetch(pageUrl, { headers: { 'User-Agent': UA } })).text();
  const cafe3cCapsule = [...pageHtml.matchAll(/https:\/\/www\.cafe3coracoes\.com\.br\/wp-content\/uploads\/[^"'\s]+\.(?:png|jpe?g)/gi)]
    .map((m) => m[0])
    .find((u) => /capsula-compativel|descafeinado/i.test(u) && !/logo|icone/i.test(u));

  const mercafeUrl = [...pageHtml.matchAll(/https:\/\/www\.mercafe\.com\.br\/capsula[^"'\s]+/gi)].map((m) => m[0])[0];
  if (!mercafeUrl) {
    return { box: null, capsule: cafe3cCapsule ?? null, catalogUrl: pageUrl };
  }

  const pdpHtml = await (await fetch(mercafeUrl, { headers: { 'User-Agent': UA } })).text();
  const urls = [...pdpHtml.matchAll(IMG_RE)].map((m) => m[0]);
  const picked = pickCompatImages(urls);
  return {
    box: picked.box,
    capsule: picked.capsule ?? cafe3cCapsule ?? null,
    catalogUrl: mercafeUrl,
  };
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.byteLength < 800) throw new Error(`muito pequeno (${buf.byteLength} B)`);
  writeFileSync(dest, buf);
  return buf.byteLength;
}

const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
let ok = 0;

for (const product of PRODUCTS) {
  process.stdout.write(`${product.slug}… `);
  try {
    const remote = await resolveMercafeImages(product.page);
    if (!remote.capsule) {
      console.log('✗ sem cápsula');
      continue;
    }

    const outDir = join(IMG_ROOT, product.slug);
    if (remote.box) {
      await download(remote.box, join(outDir, 'box.jpg'));
    }
    await download(remote.capsule, join(outDir, 'capsule.jpg'));
    await normalizeCoffeeCapsuleImage(join(outDir, 'capsule.jpg'), `nespresso/${product.slug}`);

    const entry = manifest.nespresso.find((e) => e.slug === product.slug);
    if (entry) {
      entry.box = remote.box ?? entry.box;
      entry.capsule = remote.capsule;
      entry.catalogUrl = remote.catalogUrl;
    }

    console.log('✓');
    ok++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${ok}/${PRODUCTS.length} compatíveis 3C atualizados.`);
