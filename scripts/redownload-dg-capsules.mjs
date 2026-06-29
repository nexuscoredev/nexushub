/**
 * Re-baixa capsule.jpg do Dolce Gusto (URLs c/a/capsula + fallback crop da caixa).
 *
 * Uso: node scripts/redownload-dg-capsules.mjs
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
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');
const MANIFEST = join(__dirname, 'coffee-image-manifest.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MANUAL_CAPSULE_URLS = {
  'chococino-nestle':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/c/h/chococino_capsula.png',
};

function md5(file) {
  return createHash('md5').update(readFileSync(file)).digest('hex');
}

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/starbucks\s+/gi, '')
    .replace(/®/g, '')
    .replace(/\b10\s*c[aá]psulas?\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchManifest(entry, list) {
  const bySlug = list.find((m) => m.slug === entry.slug);
  if (bySlug) return bySlug;
  const keys = [normalizeName(entry.name), normalizeName(`${entry.brand ?? ''} ${entry.name}`)];
  for (const item of list) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey)) return item;
  }
  return null;
}

function capsuleUrlCandidates(hit) {
  const urls = new Set();
  const manual = MANUAL_CAPSULE_URLS[hit.slug];
  if (manual) urls.add(manual);
  if (hit.capsule) {
    urls.add(hit.capsule);
    if (hit.capsule.includes('/m/o/capsula')) {
      urls.add(hit.capsule.replace('/m/o/capsula', '/c/a/capsula'));
    }
  }
  return [...urls];
}

async function fetchCapsule(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 12_000) return null;
  return buf;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const list = manifest['dolce-gusto'] ?? [];
  const entries = JSON.parse(readFileSync(join(CATALOG_DIR, 'dolce-gusto.json'), 'utf8'));

  let ok = 0;
  let cropped = 0;
  let skip = 0;
  let fail = 0;

  for (const entry of entries) {
    const outDir = join(IMG_ROOT, 'dolce-gusto', entry.slug);
    const capPath = join(outDir, 'capsule.jpg');
    const boxPath = join(outDir, 'box.jpg');
    const key = `dolce-gusto/${entry.slug}`;

    const hit = matchManifest(entry, list);
    if (!hit) {
      console.warn(`  ⚠ sem manifest: ${entry.name}`);
      fail++;
      continue;
    }

    const sameAsBox =
      existsSync(capPath) && existsSync(boxPath) && md5(capPath) === md5(boxPath);
    const alreadyGood =
      existsSync(capPath) &&
      !sameAsBox &&
      readFileSync(capPath).byteLength > 100_000 &&
      !process.argv.includes('--force');

    if (alreadyGood) {
      skip++;
      continue;
    }

    let buf = null;
    let source = '';

    for (const url of capsuleUrlCandidates(hit)) {
      buf = await fetchCapsule(url);
      if (buf) {
        source = url.split('/').pop() ?? url;
        break;
      }
    }

    if (!buf && existsSync(boxPath)) {
      const boxHint = hit.box ?? hit.rawBox ?? '';
      buf = await extractDolceGustoCapsuleFromBox(boxPath, boxHint);
      source = 'crop:box';
      cropped++;
    }

    if (!buf) {
      console.warn(`  ✗ ${entry.name}: sem cápsula`);
      fail++;
      continue;
    }

    writeFileSync(capPath, buf);
    await normalizeCoffeeCapsuleImage(capPath, key);
    ok++;
    console.log(`  ✓ ${entry.name} (${source})`);
  }

  writeFileSync(join(CATALOG_DIR, 'dolce-gusto.json'), `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`\n${ok} ok (${cropped} via crop), ${skip} já ok, ${fail} falhas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
