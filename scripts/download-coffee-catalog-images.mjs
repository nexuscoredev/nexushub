/**
 * Baixa todas as imagens do manifest (box + cápsula) via Node fetch.
 * Uso: node scripts/download-coffee-catalog-images.mjs [--force]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

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
    [/xicara[-_]reta\.(png|jpe?g|webp)/i, 'capsula.$1'],
    [/10_capsulas_xicara_reta\.(png|jpe?g|webp)/i, '10_capsulas_capsula.$1'],
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

function stripMagentoCache(url) {
  if (!url) return url;
  return url.replace(/\/cache\/[a-f0-9]{20,}\//i, '/');
}

/** mobile-hero (selo 10x) → xicara-reta (limpa) para imagem principal Dolce Gusto. */
function cleanDolceGustoBoxUrl(url) {
  if (!url) return url;
  const base = stripMagentoCache(url);
  return base
    .replace(/mobile[-_]?hero/gi, 'xicara-reta')
    .replace(/10_capsulas_mobile_hero/gi, '10_capsulas_xicara_reta')
    .replace(/xicara-reta-reta/gi, 'xicara-reta');
}

function dolceGustoCapsuleUrlFromBox(boxUrl) {
  if (!boxUrl) return null;
  const base = stripMagentoCache(boxUrl);
  const fromHero = base
    .replace(/xicara[-_]reta/gi, 'capsula')
    .replace(/mobile[-_]?hero/gi, 'capsula')
    .replace(/10_capsulas_xicara_reta/gi, '10_capsulas_capsula');
  return fromHero !== base ? fromHero : null;
}

function dolceGustoBoxCandidates(rawUrl) {
  const raw = stripMagentoCache(rawUrl);
  const candidates = [
    cleanDolceGustoBoxUrl(raw),
    raw.replace(/mobile[-_]?hero/gi, 'xicara_reta'),
    raw.replace(/mobile_hero/gi, 'xicara_reta'),
    raw.replace(/mobile[-_]?hero/gi, 'xicara_e_capsula'),
    dolceGustoCapsuleUrlFromBox(raw),
    raw.replace(/mobile[-_]?hero[^/]*/i, (m) => m.replace(/mobile[-_]?hero/i, 'frente')),
  ];
  return [...new Set(candidates.filter(Boolean))];
}

function isGenericPlaceholderUrl(url) {
  return /\/xicara-reta\.png$/i.test(url) || /\/capsula\.png$/i.test(url);
}

async function fetchBuffer(url, minBytes = 800) {
  const res = await fetch(stripMagentoCache(url), {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < minBytes) throw new Error(`muito pequena (${buf.byteLength} B)`);
  return buf;
}

async function pickCleanBox(rawUrl) {
  for (const url of dolceGustoBoxCandidates(rawUrl)) {
    if (isGenericPlaceholderUrl(url)) continue;
    try {
      const buf = await fetchBuffer(url, 15_000);
      return { url, buf };
    } catch {
      /* try next */
    }
  }
  const fallback = stripMagentoCache(rawUrl);
  const buf = await fetchBuffer(fallback, 15_000);
  return { url: fallback, buf };
}

const MIN_CAPSULE_BYTES = 12_000;

async function tryCapsuleUrl(url) {
  try {
    const buf = await fetchBuffer(stripMagentoCache(url), MIN_CAPSULE_BYTES);
    return { url, buf };
  } catch {
    return null;
  }
}

function dolceGustoCapsuleCandidates(explicit, boxUrl) {
  const candidates = new Set();
  if (explicit) {
    candidates.add(explicit);
    if (explicit.includes('/m/o/capsula')) {
      candidates.add(explicit.replace('/m/o/capsula', '/c/a/capsula'));
    }
  }
  const fromBox = dolceGustoCapsuleUrlFromBox(boxUrl);
  if (fromBox) {
    candidates.add(fromBox);
    if (fromBox.includes('/m/o/capsula')) {
      candidates.add(fromBox.replace('/m/o/capsula', '/c/a/capsula'));
    }
  }
  for (const url of deriveCapsuleCandidates(boxUrl)) {
    candidates.add(url);
    if (url.includes('/m/o/capsula')) {
      candidates.add(url.replace('/m/o/capsula', '/c/a/capsula'));
    }
  }
  return [...candidates];
}

async function pickCapsule(boxUrl, explicit, boxBuf, system) {
  const candidates =
    system === 'dolce-gusto'
      ? dolceGustoCapsuleCandidates(explicit, boxUrl)
      : [explicit, ...deriveCapsuleCandidates(boxUrl)].filter(Boolean);

  for (const url of candidates) {
    const hit = await tryCapsuleUrl(url);
    if (hit) return hit;
  }

  throw new Error('cápsula isolada indisponível (não usar caixa como fallback)');
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
  const bySlug = manifestList.find((m) => m.slug === entry.slug);
  if (bySlug) return bySlug;

  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
  ];
  for (const item of manifestList) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey)) return item;
  }
  return null;
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

      const rawDg = hit.rawBox ?? hit.box;
      const capsuleHint =
        hit.capsule ??
        (system === 'dolce-gusto' ? dolceGustoCapsuleUrlFromBox(rawDg) : null);

      const outDir = join(IMG_ROOT, system, entry.slug);
      mkdirSync(outDir, { recursive: true });

      try {
        const boxPick =
          system === 'dolce-gusto'
            ? await pickCleanBox(rawDg)
            : { url: hit.box, buf: await fetchBuffer(hit.box, 15_000) };
        const cap = await pickCapsule(boxPick.url, capsuleHint, boxPick.buf, system);
        writeFileSync(join(outDir, 'box.jpg'), boxPick.buf);
        writeFileSync(join(outDir, 'capsule.jpg'), cap.buf);
        const catalogKey = `${system}/${entry.slug}`;
        await normalizeCoffeeCapsuleImage(join(outDir, 'capsule.jpg'), catalogKey);
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
