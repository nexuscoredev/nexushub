/**
 * Baixa imagens do manifest via fetch no browser (CDP) e grava em public/.
 * Uso: node scripts/import-coffee-images-batch.mjs <arquivo-batch.json>
 *
 * O batch é gerado por generate-coffee-download-batches.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');

const batchFile = process.argv[2];
if (!batchFile) {
  console.error('Uso: node scripts/import-coffee-images-batch.mjs <batch.json>');
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchFile, 'utf8'));

function deriveCapsuleCandidates(boxUrl) {
  const candidates = new Set();
  const replacements = [
    /mobile[-_]?hero[^/]*\.(png|jpe?g|webp)/i,
    /mobile_hero[^/]*\.(png|jpe?g|webp)/i,
    /frente[^/]*\.(png|jpe?g|webp)/i,
    /mockups?[^/]*\.(png|jpe?g|webp)/i,
    /enxoval[^/]*\.(png|jpe?g|webp)/i,
    /hero[^/]*\.(png|jpe?g|webp)/i,
    /-02\.(png|jpe?g|webp)/i,
  ];
  for (const re of replacements) {
    candidates.add(boxUrl.replace(re, 'capsula.$1'));
    candidates.add(boxUrl.replace(re, '_capsula.$1'));
  }
  if (/-3-coracoes\.png$/i.test(boxUrl)) {
    candidates.add(boxUrl.replace(/\.png$/i, '-02.png'));
  }
  return [...candidates];
}

async function fetchBest(page, boxUrl, capsuleUrl) {
  const capCandidates = capsuleUrl ? [capsuleUrl] : deriveCapsuleCandidates(boxUrl);
  let capsule = boxUrl;
  for (const c of capCandidates) {
    try {
      const r = await page.request.get(c, { timeout: 30_000 });
      if (r.ok() && (await r.body()).byteLength > 12_000) {
        capsule = c;
        break;
      }
    } catch {
      /* next */
    }
  }
  const boxRes = await page.request.get(boxUrl, { timeout: 60_000 });
  if (!boxRes.ok()) throw new Error(`box HTTP ${boxRes.status()}`);
  const boxBody = await boxRes.body();
  const capRes = await page.request.get(capsule, { timeout: 60_000 });
  if (!capRes.ok()) throw new Error(`capsule HTTP ${capRes.status()}`);
  const capBody = await capRes.body();
  return { boxBody, capBody };
}

async function main() {
  const { chromium } = await import('playwright');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    locale: 'pt-BR',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Sessão no site DG (cookies) — ajuda em CDNs Nestlé
  await page.goto('https://www.nescafe-dolcegusto.com.br/sabores', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  }).catch(() => {});

  const updatedSystems = new Map();

  for (const item of batch) {
    const outDir = join(IMG_ROOT, item.system, item.slug);
    mkdirSync(outDir, { recursive: true });
    try {
      const { boxBody, capBody } = await fetchBest(page, item.box, item.capsule);
      writeFileSync(join(outDir, 'box.jpg'), boxBody);
      writeFileSync(join(outDir, 'capsule.jpg'), capBody);
      if (!updatedSystems.has(item.system)) {
        updatedSystems.set(
          item.system,
          JSON.parse(readFileSync(join(CATALOG_DIR, `${item.system}.json`), 'utf8')),
        );
      }
      const entries = updatedSystems.get(item.system);
      const entry = entries.find((e) => e.slug === item.slug);
      if (entry) {
        entry.images = {
          box: `/img/personal/coffee/catalog/${item.system}/${item.slug}/box.jpg`,
          capsule: `/img/personal/coffee/catalog/${item.system}/${item.slug}/capsule.jpg`,
        };
        entry.imagesPending = false;
        if (item.catalogUrl) entry.catalogUrl = item.catalogUrl;
      }
      console.log(`✓ ${item.system}/${item.slug}`);
    } catch (err) {
      console.warn(`✗ ${item.system}/${item.slug}: ${err.message}`);
    }
  }

  for (const [system, entries] of updatedSystems) {
    writeFileSync(join(CATALOG_DIR, `${system}.json`), `${JSON.stringify(entries, null, 2)}\n`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
