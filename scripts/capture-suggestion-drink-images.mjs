/**
 * Captura artes do Google Sites para sugestões de drinks (slug próprio, arte de referência).
 * Uso: node scripts/capture-suggestion-drink-images.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/img/personal/drinks');

/** [slug do arquivo, path no Google Sites] */
const SUGGESTION_SOURCES = [
  ['pisco-sour', 'whisky-sour'],
  ['gin-tonica-rose', 'gin-tonic'],
  ['vodka-tonica', 'gin-tonic'],
  ['ballena-cola', 'cuba-libre'],
  ['ballena-mule', 'moscow-mule'],
  ['ballena-tonica', 'paloma'],
  ['ballena-tonica-rose', 'cozumel'],
  ['ballena-sour', 'margarita'],
  ['jack-ginger', 'moscow-mule'],
  ['jack-honey-ginger', 'whiskey-smash'],
  ['bacardi-apple-mule', 'moscow-mule'],
  ['lillet-spritz', 'aperol-spritz'],
  ['martini-bianco', 'dry-martini'],
  ['pisco-ginger', 'moscow-mule'],
  ['sake-ginger', 'tom-collins'],
  ['royal-mule', 'moscow-mule'],
];

const SITE_BASE = 'https://sites.google.com/view/drinksv/inicio';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });

for (const [slug, sitePath] of SUGGESTION_SOURCES) {
  const url = `${SITE_BASE}/${sitePath}`;
  console.log('capture', slug, '<-', sitePath);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const img = page.locator('img').first();
  await img.waitFor({ state: 'visible', timeout: 30000 });
  await img.screenshot({
    path: path.join(outDir, `${slug}.jpg`),
    type: 'jpeg',
    quality: 90,
  });
}

await browser.close();

console.log('cropping new thumbs…');
const sharp = (await import('sharp')).default;
const thumbsDir = path.join(outDir, 'thumbs');
fs.mkdirSync(thumbsDir, { recursive: true });

const DEFAULT_CROP = { leftRatio: 0, topRatio: 0.28, widthRatio: 0.46, heightRatio: 0.72 };
const CROP_OVERRIDES = {
  'dry-martini': { topRatio: 0.24, widthRatio: 0.52, heightRatio: 0.76 },
  'moscow-mule': { topRatio: 0.26, widthRatio: 0.44, heightRatio: 0.74 },
  'margarita': { topRatio: 0.38, widthRatio: 0.38, heightRatio: 0.62 },
  'cozumel': { topRatio: 0.3, widthRatio: 0.42, heightRatio: 0.7 },
};

for (const [slug] of SUGGESTION_SOURCES) {
  const file = `${slug}.jpg`;
  const input = path.join(outDir, file);
  if (!fs.existsSync(input)) continue;

  const sourceSlug = SUGGESTION_SOURCES.find(([s]) => s === slug)?.[1] ?? slug;
  const crop = { ...DEFAULT_CROP, ...CROP_OVERRIDES[sourceSlug] };
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 382;
  const height = meta.height ?? 382;
  const left = Math.max(0, Math.round(width * crop.leftRatio));
  const top = Math.max(0, Math.round(height * crop.topRatio));
  const extractWidth = Math.min(width - left, Math.round(width * crop.widthRatio));
  const extractHeight = Math.min(height - top, Math.round(height * crop.heightRatio));

  await sharp(input)
    .extract({ left, top, width: extractWidth, height: extractHeight })
    .resize(512, 512, { fit: 'contain', background: { r: 8, g: 8, b: 10 }, position: 'bottom' })
    .jpeg({ quality: 88 })
    .toFile(path.join(thumbsDir, file));

  console.log('thumb', slug);
}

console.log('done');
