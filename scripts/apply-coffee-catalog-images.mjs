/**
 * Aplica imagens ao catálogo a partir de URLs (extraídas do site oficial).
 * Baixa via fetch no browser (Playwright) — sites bloqueiam Node fetch direto.
 *
 * Uso: node scripts/apply-coffee-catalog-images.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');
const MANIFEST = join(__dirname, 'coffee-image-manifest.json');

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

function stripCache(url) {
  return url.replace(/\/cache\/[a-f0-9]+\//i, '/');
}

function deriveCapsuleCandidates(boxUrl) {
  const url = boxUrl;
  const candidates = new Set();
  const replacements = [
    /mobile[-_]?hero[^/]*\.(png|jpe?g|webp)/i,
    /mobile_hero[^/]*\.(png|jpe?g|webp)/i,
    /frente[^/]*\.(png|jpe?g|webp)/i,
    /mockups?[^/]*\.(png|jpe?g|webp)/i,
    /enxoval[^/]*\.(png|jpe?g|webp)/i,
    /hero[^/]*\.(png|jpe?g|webp)/i,
    /[-_]?images[^/]*\.(png|jpe?g|webp)/i,
  ];
  for (const re of replacements) {
    candidates.add(url.replace(re, 'capsula.$1'));
    candidates.add(url.replace(re, '_capsula.$1'));
  }
  const base = url.replace(/\/[^/]+$/, '');
  const file = url.split('/').pop() ?? '';
  const slugMatch = file.match(/^([a-z0-9_-]+?)(?:[-_](?:mobile|hero|frente|mockup|enxoval|images))/i);
  if (slugMatch) {
    candidates.add(`${base}/${slugMatch[1]}_capsula.png`);
  }
  return [...candidates];
}

async function pickCapsuleUrl(page, boxUrl) {
  for (const candidate of deriveCapsuleCandidates(boxUrl)) {
    try {
      const res = await page.request.get(candidate, { timeout: 20_000 });
      if (!res.ok()) continue;
      const buf = await res.body();
      if (buf.byteLength > 12_000) return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

function loadCatalog(system) {
  return JSON.parse(readFileSync(join(CATALOG_DIR, `${system}.json`), 'utf8'));
}

function saveCatalog(system, entries) {
  writeFileSync(join(CATALOG_DIR, `${system}.json`), `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function matchManifest(entry, manifestBySystem) {
  const list = manifestBySystem[entry.system] ?? [];
  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
  ];
  for (const item of list) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey || k.includes(itemKey) || itemKey.includes(k))) {
      return item;
    }
  }
  return null;
}

async function downloadFile(page, url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const res = await page.request.get(url, { timeout: 60_000 });
  if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
  const body = await res.body();
  if (body.byteLength < 800) throw new Error(`muito pequena (${body.byteLength} B)`);
  writeFileSync(dest, body);
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profile = join(__dirname, '.pw-browser-data');
  mkdirSync(profile, { recursive: true });

  const context = await chromium.launchPersistentContext(profile, {
    executablePath: existsSync(chromePath) ? chromePath : undefined,
    headless: false,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
    locale: 'pt-BR',
    viewport: { width: 1400, height: 900 },
  });

  const page = context.pages()[0] ?? (await context.newPage());

  // Abre o site DG para obter cookies/sessão válidos
  await page.goto('https://www.nescafe-dolcegusto.com.br/sabores', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(5000);

  const systems = ['dolce-gusto', 'nespresso', 'tres-coracoes'];
  let totalOk = 0;

  for (const system of systems) {
    const entries = loadCatalog(system);
    let ok = 0;
    let fail = 0;

    for (const entry of entries) {
      if (entry.images?.box && entry.images?.capsule && !process.argv.includes('--force')) continue;

      const hit = matchManifest(entry, manifest);
      if (!hit?.box) {
        console.warn(`  ⚠ sem URL: [${system}] ${entry.name}`);
        fail++;
        continue;
      }

      const outDir = join(IMG_ROOT, system, entry.slug);
      const boxPath = join(outDir, 'box.jpg');
      const capPath = join(outDir, 'capsule.jpg');
      const boxUrl = hit.box;
      let capUrl = hit.capsule ?? (await pickCapsuleUrl(page, boxUrl));

      try {
        await downloadFile(page, boxUrl, boxPath);
        await downloadFile(page, capUrl ?? boxUrl, capPath);
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
      }
    }

    saveCatalog(system, entries);
    console.log(`${system}: ${ok} ok, ${fail} falhas`);
  }

  await context.close();
  console.log(`\nTotal: ${totalOk} imagens aplicadas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
