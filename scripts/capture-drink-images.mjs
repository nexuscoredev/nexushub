import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/img/personal/drinks');

const DRINKS = [
  ['whisky-sour', 'whisky-sour'],
  ['whisky-cola', 'whisky-cola'],
  ['mojito', 'mojito'],
  ['negroni', 'negroni'],
  ['moscow-mule', 'moscow-mule'],
  ['daiquiri', 'daiquiri'],
  ['margarita', 'margarita'],
  ['margarita-blue', 'margarita-blue'],
  ['dry-martini', 'dry-martini'],
  ['vesper-martini', 'vesper-martini'],
  ['cuba-libre', 'cuba-libre'],
  ['cozumel', 'cozumel'],
  ['caipitudo', 'caipitudo'],
  ['caipiroska-de-limao', 'caipiroska-de-lim%C3%A3o'],
  ['caipiroska-de-maracuja', 'caipiroska-de-maracuj%C3%A1'],
  ['blue-lagoon', 'blue-lagoon'],
  ['bloody-mary', 'bloody-mary'],
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });

for (const [slug, sitePath] of DRINKS) {
  const url = `https://sites.google.com/view/drinksv/inicio/${sitePath}`;
  console.log('capture', slug);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const img = page.locator('img').first();
  await img.waitFor({ state: 'visible', timeout: 30000 });
  await img.screenshot({
    path: path.join(outDir, `${slug}.jpg`),
    type: 'jpeg',
    quality: 90,
  });
}

console.log('capture banner');
await page.goto('https://sites.google.com/view/drinksv/inicio', {
  waitUntil: 'networkidle',
  timeout: 60000,
});
await page.waitForTimeout(1500);
const banner = page.locator('img').first();
await banner.screenshot({
  path: path.join(outDir, 'banner.jpg'),
  type: 'jpeg',
  quality: 90,
});

await browser.close();
console.log('done', outDir);
