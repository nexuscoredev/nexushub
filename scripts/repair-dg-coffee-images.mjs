/**
 * Re-baixa box/capsule Dolce Gusto com URLs derivadas do path do produto.
 * node scripts/repair-dg-coffee-images.mjs [--force]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractDolceGustoCapsuleFromBox,
  normalizeCoffeeCapsuleImage,
} from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog/dolce-gusto');
const MANIFEST = join(__dirname, 'coffee-image-manifest.json');
const CATALOG_FILE = join(ROOT, 'src/data/coffeeCapsuleCatalog/dolce-gusto.json');
const FORCE = process.argv.includes('--force');
const MIN_CAPSULE = 15_000;
const MIN_BOX = 15_000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MANUAL_CAPSULE_URLS = {
  'chococino-nestle':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/c/h/chococino_capsula.png',
};

function md5File(file) {
  return createHash('md5').update(readFileSync(file)).digest('hex');
}

function md5Buf(buf) {
  return createHash('md5').update(buf).digest('hex');
}

function stripMagentoCache(url) {
  return url?.replace(/\/cache\/[a-f0-9]{20,}\//i, '/') ?? url;
}

function cleanDolceGustoBoxUrl(url) {
  return stripMagentoCache(url)
    .replace(/mobile[-_]?hero/gi, 'xicara-reta')
    .replace(/10_capsulas_mobile_hero/gi, '10_capsulas_xicara_reta')
    .replace(/xicara-reta-reta/gi, 'xicara-reta');
}

function dolceGustoCapsuleUrlFromBox(boxUrl) {
  if (!boxUrl) return null;
  const base = stripMagentoCache(boxUrl);
  const capsule = base
    .replace(/xicara[-_]reta/gi, 'capsula')
    .replace(/mobile[-_]?hero/gi, 'capsula')
    .replace(/10_capsulas_xicara_reta/gi, '10_capsulas_capsula')
    .replace(/frente_/gi, 'capsula_');
  return capsule !== base ? capsule : null;
}

function capsuleCandidates(hit, boxUrl) {
  const urls = new Set();
  if (MANUAL_CAPSULE_URLS[hit.slug]) urls.add(MANUAL_CAPSULE_URLS[hit.slug]);
  if (hit.capsule) {
    urls.add(hit.capsule);
    if (hit.capsule.includes('/m/o/capsula')) {
      urls.add(hit.capsule.replace('/m/o/capsula', '/c/a/capsula'));
    }
  }
  const fromBox = dolceGustoCapsuleUrlFromBox(boxUrl);
  if (fromBox) urls.add(fromBox);
  const raw = stripMagentoCache(boxUrl);
  const stem = raw.split('/').pop()?.replace(/\.(png|jpe?g|webp)$/i, '') ?? '';
  const dir = raw.slice(0, raw.lastIndexOf('/') + 1);
  urls.add(`${dir}${stem.replace(/xicara[-_]reta/i, 'capsula')}.png`);
  urls.add(`${dir}capsula.png`);
  return [...urls];
}

const MANUAL_RAW_BOX = {
  'nestea-pessego':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/n/e/nestea_pessego_10_capsulas_mobile_hero.png',
};

function boxCandidates(hit) {
  const manual = MANUAL_RAW_BOX[hit.slug];
  const raw = stripMagentoCache(hit.rawBox ?? hit.box);
  const cached = hit.rawBox?.includes('/cache/') ? hit.rawBox : null;
  return [
    manual,
    cached,
    cleanDolceGustoBoxUrl(raw),
    raw.replace(/mobile[-_]?hero/gi, 'xicara_reta'),
    raw.replace(/10_capsulas_mobile_hero/gi, '10_capsulas_xicara_reta'),
    raw.replace(/_xicara_reta/gi, '_mobile_hero'),
    raw,
  ].filter(Boolean);
}

async function fetchBuf(url, min = 8_000) {
  const res = await fetch(stripMagentoCache(url), {
    headers: { 'User-Agent': UA, Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < min) return null;
  return buf;
}

async function pickBox(hit) {
  for (const url of [...new Set(boxCandidates(hit))]) {
    const buf = await fetchBuf(url, MIN_BOX);
    if (buf) return { url, buf };
  }
  return null;
}

async function pickCapsule(hit, boxUrl, boxBuf) {
  for (const url of capsuleCandidates(hit, boxUrl)) {
    const buf = await fetchBuf(url, MIN_CAPSULE);
    if (buf && md5Buf(buf) !== md5Buf(boxBuf) && buf.byteLength >= MIN_CAPSULE) {
      return { url, buf };
    }
  }
  const cropped = await extractDolceGustoCapsuleFromBox(boxBuf, boxUrl);
  if (cropped?.byteLength >= 4_000) return { url: 'crop:box', buf: cropped };
  return null;
}

function needsRepair(slug, capPath, boxPath) {
  if (FORCE) return true;
  if (!existsSync(capPath) || !existsSync(boxPath)) return true;
  const capSize = readFileSync(capPath).length;
  const same = md5File(capPath) === md5File(boxPath);
  return capSize < MIN_CAPSULE || same;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const list = manifest['dolce-gusto'] ?? [];

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const hit of list) {
    const capPath = join(IMG_ROOT, hit.slug, 'capsule.jpg');
    const boxPath = join(IMG_ROOT, hit.slug, 'box.jpg');
    if (!needsRepair(hit.slug, capPath, boxPath)) {
      skip++;
      continue;
    }

    process.stdout.write(`${hit.slug}… `);
    const boxPick = await pickBox(hit);
    if (!boxPick) {
      console.log('✗ box');
      fail++;
      continue;
    }

    const capPick = await pickCapsule(hit, boxPick.url, boxPick.buf);
    if (!capPick) {
      console.log('✗ capsule');
      fail++;
      continue;
    }

    writeFileSync(boxPath, boxPick.buf);
    writeFileSync(capPath, capPick.buf);
    await normalizeCoffeeCapsuleImage(capPath, `dolce-gusto/${hit.slug}`);

    hit.box = boxPick.url;
    if (capPick.url !== 'crop:box') hit.capsule = capPick.url;

    const entry = catalog.find((e) => e.slug === hit.slug);
    if (entry) {
      entry.images = {
        box: `/img/personal/coffee/catalog/dolce-gusto/${hit.slug}/box.jpg`,
        capsule: `/img/personal/coffee/catalog/dolce-gusto/${hit.slug}/capsule.jpg`,
      };
      entry.imagesPending = false;
    }

    ok++;
    console.log(`✓ (${capPick.url === 'crop:box' ? 'crop' : 'url'})`);
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`\n${ok} ok, ${skip} skip, ${fail} falhas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
