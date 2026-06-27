/**
 * Baixa todas as imagens do manifest (box + cápsula) via Node fetch.
 * Uso: node scripts/download-coffee-catalog-images.mjs [--force]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');
const MANIFEST = join(__dirname, 'coffee-image-manifest.json');
const FORCE = process.argv.includes('--force');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function deriveCapsuleCandidates(boxUrl) {
  const candidates = new Set();
  const replacements = [
    [/mobile[-_]?hero[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/mobile_hero[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/frente[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/mockups?[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/enxoval[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/hero[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/[-_]?images[^/]*\.(png|jpe?g|webp)/i, 'capsula.$1'],
  ];
  for (const [re, rep] of replacements) {
    candidates.add(boxUrl.replace(re, rep));
    candidates.add(boxUrl.replace(re, `_capsula.$1`.replace('.$1', '.$1')));
  }
  if (/-3-coracoes\.png$/i.test(boxUrl)) {
    candidates.add(boxUrl.replace(/\.png$/i, '-02.png'));
  }
  return [...candidates];
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 800) throw new Error(`muito pequena (${buf.byteLength} B)`);
  return buf;
}

async function pickCapsule(boxUrl, explicit) {
  const candidates = explicit ? [explicit, ...deriveCapsuleCandidates(boxUrl)] : deriveCapsuleCandidates(boxUrl);
  for (const url of candidates) {
    try {
      const buf = await fetchBuffer(url);
      if (buf.byteLength > 12_000) return { url, buf };
    } catch {
      /* try next */
    }
  }
  const boxBuf = await fetchBuffer(boxUrl);
  return { url: boxUrl, buf: boxBuf };
}

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/starbucks\s+/gi, '')
    .replace(/®/g, '')
    .replace(/\b10\s*c[aá]psulas?\b/gi, '')
    .replace(/embalagem\s+kopenhagen\s+/i, '')
    .replace(/com capsula x\d+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchManifest(entry, manifestList) {
  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
  ];
  for (const item of manifestList) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey || k.includes(itemKey) || itemKey.includes(k))) {
      return item;
    }
  }
  return manifestList.find((m) => m.slug === entry.slug) ?? null;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const systems = ['dolce-gusto', 'nespresso', 'tres-coracoes'];
  let totalOk = 0;
  let totalFail = 0;

  for (const system of systems) {
    const entries = JSON.parse(readFileSync(join(CATALOG_DIR, `${system}.json`), 'utf8'));
    const list = manifest[system] ?? [];
    let ok = 0;
    let fail = 0;
    let skip = 0;

    for (const entry of entries) {
      if (!FORCE && entry.images?.box && entry.images?.capsule && !entry.imagesPending) {
        skip++;
        continue;
      }

      const hit = matchManifest(entry, list);
      if (!hit?.box) {
        console.warn(`  ⚠ sem URL: [${system}] ${entry.name}`);
        fail++;
        continue;
      }

      const outDir = join(IMG_ROOT, system, entry.slug);
      mkdirSync(outDir, { recursive: true });

      try {
        const boxBuf = await fetchBuffer(hit.box);
        const cap = await pickCapsule(hit.box, hit.capsule);
        writeFileSync(join(outDir, 'box.jpg'), boxBuf);
        writeFileSync(join(outDir, 'capsule.jpg'), cap.buf);
        entry.images = {
          box: `/img/personal/coffee/catalog/${system}/${entry.slug}/box.jpg`,
          capsule: `/img/personal/coffee/catalog/${system}/${entry.slug}/capsule.jpg`,
        };
        entry.imagesPending = false;
        if (hit.catalogUrl) entry.catalogUrl = hit.catalogUrl;
        ok++;
        totalOk++;
        console.log(`  ✓ ${entry.name}`);
      } catch (err) {
        console.warn(`  ✗ ${entry.name}: ${err.message}`);
        fail++;
        totalFail++;
      }
    }

    writeFileSync(join(CATALOG_DIR, `${system}.json`), `${JSON.stringify(entries, null, 2)}\n`);
    console.log(`${system}: ${ok} ok, ${fail} falhas, ${skip} já existiam\n`);
  }

  console.log(`Total: ${totalOk} baixados, ${totalFail} falhas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
