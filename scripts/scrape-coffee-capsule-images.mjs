/**
 * Baixa imagens (caixa + cápsula) do catálogo oficial para public/img/personal/coffee/catalog/.
 *
 * Uso:
 *   node scripts/scrape-coffee-capsule-images.mjs
 *   node scripts/scrape-coffee-capsule-images.mjs --system=dolce-gusto
 *   node scripts/scrape-coffee-capsule-images.mjs --force
 *
 * Requer Chrome instalado (Playwright usa channel: 'chrome').
 */
import { chromium } from 'playwright';
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  createWriteStream,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');

const SYSTEM_URLS = {
  'dolce-gusto': 'https://www.nescafe-dolcegusto.com.br/sabores',
  nespresso: 'https://www.nespresso.com/br/pt/order/capsules/original',
  'tres-coracoes': 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/',
};

const args = process.argv.slice(2);
const force = args.includes('--force');
const systemArg = args.find((a) => a.startsWith('--system='))?.split('=')[1];

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/starbucks\s+/gi, '')
    .replace(/\b10\s*c[aá]psulas?\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function stripCache(url) {
  return url.replace(/\/cache\/[a-f0-9]+\//i, '/');
}

function pickBoxUrl(urls) {
  const list = urls.map(stripCache);
  const frente = list.find((u) => /_frente\.(png|jpe?g|webp)/i.test(u));
  if (frente) return frente;
  const hero = list.find((u) => /mobile[-_]?hero|mockup|mockups/i.test(u));
  if (hero) return hero;
  const box = list.find((u) => /box|embalagem|pack/i.test(u));
  if (box) return box;
  return list.find((u) => !/_capsula|_topo|_lado|_xicara|relative-size|perspec|tr_s/i.test(u)) ?? list[0];
}

function pickCapsuleUrl(urls) {
  const list = urls.map(stripCache);
  return (
    list.find((u) => /_capsula\.(png|jpe?g|webp)/i.test(u)) ??
    list.find((u) => /capsule|cap[-_]/i.test(u)) ??
    null
  );
}

async function downloadImage(page, url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const response = await page.request.get(url, { timeout: 60_000 });
  if (!response.ok()) throw new Error(`HTTP ${response.status()} ${url}`);
  const body = await response.body();
  if (body.byteLength < 800) throw new Error(`Imagem muito pequena (${body.byteLength} B)`);
  writeFileSync(dest, body);
  return body.byteLength;
}

async function launchBrowser() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  return chromium.launch({
    executablePath: existsSync(chromePath) ? chromePath : undefined,
    channel: existsSync(chromePath) ? undefined : 'chrome',
    headless: false,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
}

async function acceptCookies(page) {
  const selectors = [
    'button:has-text("CONTINUAR")',
    'button:has-text("Continuar")',
    'button:has-text("Aceitar")',
    '#onetrust-accept-btn-handler',
    '[data-testid="cookie-accept"]',
  ];
  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
      break;
    }
  }
}

async function scrapeDolceGusto(page) {
  const url = SYSTEM_URLS['dolce-gusto'];
  console.log('DG →', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await acceptCookies(page);
  await page.waitForTimeout(4000);

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
    await page.waitForTimeout(600);
  }

  const listing = await page.evaluate(() => {
    const items = new Map();
    for (const img of document.querySelectorAll('img[alt]')) {
      const alt = img.alt.trim();
      if (!/c[aá]psulas?/i.test(alt)) continue;
      if (/combo|kit|xicara|lixeira|porta|boas.?vindas|personalizado/i.test(alt)) continue;
      const name = alt.replace(/\s*10\s*c[aá]psulas?/i, '').trim();
      if (!name) continue;
      const src = img.currentSrc || img.src;
      if (!src || !src.includes('catalog/product')) continue;
      const key = name.toLowerCase();
      if (!items.has(key)) items.set(key, { name, listingImg: src });
    }
    return [...items.values()];
  });

  console.log(`DG listagem: ${listing.length} produtos`);

  const scraped = new Map();
  const productLinks = page.locator('a').filter({ hasText: /10\s*c[aá]psulas?/i });
  const count = await productLinks.count();
  const seen = new Set();

  for (let i = 0; i < count; i++) {
    const link = productLinks.nth(i);
    const text = ((await link.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    if (!text || seen.has(text)) continue;
    if (/combo|kit|adicionar|diminuir|aumentar/i.test(text) && !/c[aá]psulas?/i.test(text)) continue;
    if (/combo|kit|xicara|lixeira|porta cápsulas/i.test(text)) continue;

    seen.add(text);
    try {
      await link.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await link.click({ timeout: 10_000 });
      await page.waitForTimeout(1200);

      const detail = await page.evaluate(() => {
        const title =
          document.querySelector('h1.page-title, .page-title, h1')?.textContent?.trim() ?? '';
        const imgs = [
          ...document.querySelectorAll(
            '.fotorama img, .gallery-placeholder img, .product__section--media img, img[src*="catalog/product"]',
          ),
        ]
          .map((img) => img.currentSrc || img.src)
          .filter(Boolean);
        return { title, imgs: [...new Set(imgs)] };
      });

      const name = detail.title || text;
      const norm = normalizeName(name);
      if (!norm) continue;

      scraped.set(norm, {
        name: name.replace(/\s*10\s*c[aá]psulas?/i, '').trim(),
        box: pickBoxUrl(detail.imgs),
        capsule: pickCapsuleUrl(detail.imgs),
        catalogUrl: page.url(),
      });
      process.stdout.write('.');
    } catch (err) {
      process.stdout.write('x');
    }
  }
  console.log(`\nDG detalhe: ${scraped.size} produtos`);

  for (const item of listing) {
    const norm = normalizeName(item.name);
    if (scraped.has(norm)) continue;
    scraped.set(norm, {
      name: item.name,
      box: stripCache(item.listingImg),
      capsule: null,
      catalogUrl: url,
    });
  }

  return scraped;
}

async function scrapeNespresso(page) {
  const url = SYSTEM_URLS.nespresso;
  console.log('Nespresso →', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await acceptCookies(page);
  await page.waitForTimeout(5000);

  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(700);
  }

  const products = await page.evaluate(() => {
    const out = new Map();
    const cards = document.querySelectorAll(
      '[data-product-code], .ProductCard, article, [class*="capsule"], [class*="product"]',
    );
    for (const card of cards) {
      const name =
        card.querySelector('h2, h3, [class*="title"], [class*="name"]')?.textContent?.trim() ?? '';
      if (!name || name.length < 2) continue;
      const imgs = [...card.querySelectorAll('img')]
        .map((i) => i.currentSrc || i.src)
        .filter((s) => s && !/logo|icon|sprite/i.test(s));
      const link = card.querySelector('a[href*="capsule"], a[href*="product"]')?.href;
      if (!imgs.length) continue;
      const key = name.toLowerCase();
      if (!out.has(key)) out.set(key, { name, imgs, catalogUrl: link ?? location.href });
    }

    if (out.size < 3) {
      for (const img of document.querySelectorAll('img[src]')) {
        const alt = img.alt?.trim();
        const src = img.currentSrc || img.src;
        if (!alt || alt.length < 3 || !src || /logo/i.test(src)) continue;
        if (!/nespresso|capsule|capsula|caf[eé]/i.test(alt + src)) continue;
        const key = alt.toLowerCase();
        if (!out.has(key)) out.set(key, { name: alt, imgs: [src], catalogUrl: location.href });
      }
    }

    return [...out.values()];
  });

  console.log(`Nespresso listagem: ${products.length} itens`);
  const scraped = new Map();
  for (const p of products) {
    const norm = normalizeName(p.name);
    scraped.set(norm, {
      name: p.name,
      box: pickBoxUrl(p.imgs),
      capsule: pickCapsuleUrl(p.imgs),
      catalogUrl: p.catalogUrl,
    });
  }
  return scraped;
}

async function scrapeTresCoracoes(page) {
  const base = SYSTEM_URLS['tres-coracoes'];
  console.log('Três Corações →', base);
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await acceptCookies(page);
  await page.waitForTimeout(4000);

  const sectionLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="capsula"], a[href*="capsulas"]')]
      .map((a) => a.href)
      .filter((h) => h.includes('cafe3coracoes'))
      .filter((h, i, arr) => arr.indexOf(h) === i),
  );

  const pages = [base, ...sectionLinks.filter((u) => u !== base)];
  const scraped = new Map();

  for (const pageUrl of pages) {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }

    const products = await page.evaluate(() => {
      const out = new Map();
      for (const card of document.querySelectorAll(
        '[class*="product"], article, .card, li',
      )) {
        const name =
          card.querySelector('h2, h3, h4, [class*="title"], [class*="name"], strong')
            ?.textContent?.trim() ?? '';
        if (!name || name.length < 4) continue;
        if (!/espresso|lungo|cappuccino|ristretto|capsula|cápsula/i.test(name)) continue;
        const imgs = [...card.querySelectorAll('img')]
          .map((i) => i.currentSrc || i.src)
          .filter((s) => s && !/logo|icon|banner/i.test(s));
        const link = card.querySelector('a')?.href;
        if (!imgs.length) continue;
        out.set(name.toLowerCase(), { name, imgs, catalogUrl: link ?? location.href });
      }
      return [...out.values()];
    });

    for (const p of products) {
      scraped.set(normalizeName(p.name), {
        name: p.name,
        box: pickBoxUrl(p.imgs),
        capsule: pickCapsuleUrl(p.imgs),
        catalogUrl: p.catalogUrl,
      });
    }
  }

  console.log(`Três Corações: ${scraped.size} produtos`);
  return scraped;
}

const SCRAPERS = {
  'dolce-gusto': scrapeDolceGusto,
  nespresso: scrapeNespresso,
  'tres-coracoes': scrapeTresCoracoes,
};

function loadCatalog(system) {
  const file = join(CATALOG_DIR, `${system}.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function saveCatalog(system, entries) {
  const file = join(CATALOG_DIR, `${system}.json`);
  writeFileSync(file, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function matchScraped(entry, scrapedMap) {
  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
    entry.slug.replace(/-/g, ' '),
  ];
  for (const key of keys) {
    if (scrapedMap.has(key)) return scrapedMap.get(key);
  }
  for (const [key, value] of scrapedMap) {
    if (key.includes(keys[0]) || keys[0].includes(key)) return value;
  }
  return null;
}

async function processSystem(page, system) {
  const entries = loadCatalog(system);
  const scrapedMap = await SCRAPERS[system](page);
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const entry of entries) {
    const hasImages = entry.images?.box && entry.images?.capsule;
    if (hasImages && !force) {
      skip++;
      continue;
    }

    const hit = matchScraped(entry, scrapedMap);
    if (!hit?.box) {
      console.warn(`  ⚠ sem imagem: ${entry.name}`);
      fail++;
      continue;
    }

    const outDir = join(IMG_ROOT, system, entry.slug);
    const boxPath = join(outDir, 'box.jpg');
    const capPath = join(outDir, 'capsule.jpg');
    const boxUrl = hit.box;
    const capUrl = hit.capsule ?? hit.box;

    try {
      await downloadImage(page, boxUrl, boxPath);
      await downloadImage(page, capUrl, capPath);

      entry.images = {
        box: `/img/personal/coffee/catalog/${system}/${entry.slug}/box.jpg`,
        capsule: `/img/personal/coffee/catalog/${system}/${entry.slug}/capsule.jpg`,
      };
      entry.imagesPending = false;
      if (hit.catalogUrl && hit.catalogUrl !== SYSTEM_URLS[system]) {
        entry.catalogUrl = hit.catalogUrl;
      }
      ok++;
      console.log(`  ✓ ${entry.name}`);
    } catch (err) {
      console.warn(`  ✗ ${entry.name}: ${err.message}`);
      fail++;
    }
  }

  saveCatalog(system, entries);
  console.log(`${system}: ${ok} ok, ${skip} já tinham, ${fail} falhas`);
}

async function main() {
  const systems = systemArg ? [systemArg] : Object.keys(SCRAPERS);
  const browser = await launchBrowser();
  const context = await browser.newContext({
    locale: 'pt-BR',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    for (const system of systems) {
      if (!SCRAPERS[system]) {
        console.error(`Sistema desconhecido: ${system}`);
        continue;
      }
      console.log(`\n=== ${system} ===`);
      await processSystem(page, system);
    }
  } finally {
    await browser.close();
  }

  console.log('\nConcluído.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
