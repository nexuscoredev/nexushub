/**
 * Baixa cápsulas Nespresso isoladas (≠ caixa) e atualiza manifest.
 * node scripts/fix-nespresso-capsules.mjs
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog/nespresso');
const MANIFEST_FILE = join(__dirname, 'coffee-image-manifest.json');
const EXTRACTED_FILE = join(__dirname, '_nespresso-br-extracted.json');
const CATALOG_FILE = join(ROOT, 'src/data/coffeeCapsuleCatalog/nespresso.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MIN_CAPSULE = 2_500;

function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

const NESPRESSO_PDP_BY_SLUG = {
  'fortissio-lungo':
    'https://www.nespresso.com/br/pt/order/capsules/original/capsulas-cafe-stockholm-fortissio-lungo',
  'linizio-lungo':
    'https://www.nespresso.com/br/pt/order/capsules/original/capsulas-cafe-vienna-linizio-lungo',
  'vivalto-lungo':
    'https://www.nespresso.com/br/pt/order/capsules/original/capsulas-cafe-tokyo-vivalto-lungo',
  'lisbon-bica': 'https://www.nespresso.com/br/pt/order/capsules/original/capsula-cafe-lisbon-bica',
  'caffe-florian':
    'https://www.nespresso.com/br/pt/order/capsules/original/capsulas-cafe-caffe-florian',
  'vienna-lungo-decaffeinato':
    'https://www.nespresso.com/br/pt/order/capsules/original/capsulas-de-cafe-vienna-lungo-decaffeinato',
};

const NESPRESSO_MANUAL_CAPSULE = {
  'lisbon-bica':
    'https://www.nespresso.com/ecom/medias/sys_master/public/30234256080926/C-1211-OL-Product-684x378.jpg',
  'caffe-florian':
    'https://www.nespresso.com/ecom/medias/sys_master/public/35022544896030/C-1299-OL-Product-684x378.jpg',
  'vienna-lungo-decaffeinato':
    'https://www.nespresso.com/shared_res/agility/global/coffees/ol/sku-main-info-product/vienna-lungo-decaffeinato_2x.png',
};

const NESPRESSO_SKU_SLUG_ALIASES = {
  'fortissio-lungo': ['fortissio-lungo', 'stockholm-fortissio-lungo', 'stockholm-lungo'],
  'linizio-lungo': ['linizio-lungo', 'vienna-linizio-lungo', 'vienna-lungo'],
  'vivalto-lungo': ['vivalto-lungo', 'tokyo-vivalto-lungo', 'tokyo-lungo'],
};

async function fetchImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < MIN_CAPSULE) return null;
  return buf;
}

function extractPdpImageUrls(html) {
  const urls = new Set();

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Product' && item.image) {
          const imgs = Array.isArray(item.image) ? item.image : [item.image];
          for (const img of imgs) urls.add(String(img).split('?')[0]);
        }
      }
    } catch {
      /* skip */
    }
  }

  for (const m of html.matchAll(/<script type="application\/json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      if (data?.id !== 'ProductDetails') continue;
      const image = data?.components?.[0]?.variations?.[0]?.properties?.copywriting?.image;
      if (image) urls.add(String(image).split('?')[0]);
    } catch {
      /* skip */
    }
  }

  for (const m of html.matchAll(/https:\/\/www\.nespresso\.com\/ecom\/medias\/[^"'\\s]+/g)) {
    urls.add(m[0].split('?')[0]);
  }
  for (const m of html.matchAll(/https:\/\/www\.nespresso\.com\/shared_res\/[^"'\\s]+/g)) {
    urls.add(m[0].split('?')[0]);
  }

  return [...urls];
}

async function resolveCapsuleUrl(slug, boxUrl, pdpUrl, boxHash) {
  const manual = NESPRESSO_MANUAL_CAPSULE[slug];
  if (manual) {
    const manualBuf = await fetchImage(manual);
    if (manualBuf && md5(manualBuf) !== boxHash) {
      return { url: manual, buf: manualBuf, source: 'manual' };
    }
  }

  for (const sku of skuMainCandidates(slug)) {
    const skuBuf = await fetchImage(sku);
    if (skuBuf && md5(skuBuf) !== boxHash) {
      return { url: sku, buf: skuBuf, source: 'sku-main' };
    }
  }

  const resolvedPdp = NESPRESSO_PDP_BY_SLUG[slug] ?? pdpUrl;
  if (!resolvedPdp?.includes('/capsula')) return null;
  const html = await (await fetch(resolvedPdp, { headers: { 'User-Agent': UA } })).text();
  const candidates = extractPdpImageUrls(html);

  for (const url of candidates) {
    if (/coffee-sleeves|sleeves_|packshot|big-pack|36caps/i.test(url)) continue;
    const buf = await fetchImage(url);
    if (!buf) continue;
    if (md5(buf) === boxHash) continue;
    return { url, buf, source: 'pdp' };
  }

  return null;
}

function skuMainCandidates(slug) {
  const slugs = NESPRESSO_SKU_SLUG_ALIASES[slug] ?? [slug];
  return slugs.map(
    (s) => `https://www.nespresso.com/shared_res/agility/global/coffees/ol/sku-main-info-product/${s}_2x.png`,
  );
}
async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
  const extracted = JSON.parse(readFileSync(EXTRACTED_FILE, 'utf8'));
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const pdpBySlug = Object.fromEntries(extracted.map((e) => [e.slug, e.catalogUrl]));

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const item of manifest.nespresso) {
    if (item.slug.startsWith('3c-')) continue;

    const boxPath = join(IMG_ROOT, item.slug, 'box.jpg');
    const capPath = join(IMG_ROOT, item.slug, 'capsule.jpg');
    let boxHash = null;
    try {
      boxHash = md5(readFileSync(boxPath));
      const capHash = md5(readFileSync(capPath));
      if (capHash !== boxHash && readFileSync(capPath).length >= 15_000) {
        skip++;
        continue;
      }
    } catch {
      console.warn(`  ⚠ sem box: ${item.slug}`);
      fail++;
      continue;
    }

    const hit = await resolveCapsuleUrl(
      item.slug,
      item.box,
      NESPRESSO_PDP_BY_SLUG[item.slug] ?? pdpBySlug[item.slug],
      boxHash,
    );
    if (!hit) {
      console.warn(`  ✗ ${item.slug}: sem cápsula distinta`);
      fail++;
      continue;
    }

    mkdirSync(dirname(capPath), { recursive: true });
    writeFileSync(capPath, hit.buf);
    await normalizeCoffeeCapsuleImage(capPath, `nespresso/${item.slug}`);
    item.capsule = hit.url;

    const entry = catalog.find((e) => e.slug === item.slug);
    if (entry) {
      entry.images = entry.images ?? {};
      entry.images.capsule = `/img/personal/coffee/catalog/nespresso/${item.slug}/capsule.jpg`;
      entry.imagesPending = false;
    }

    ok++;
    console.log(`  ✓ ${item.slug} (${hit.source})`);
  }

  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`\n${ok} corrigidas, ${skip} já ok, ${fail} falhas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
