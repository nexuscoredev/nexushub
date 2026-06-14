/**
 * Gera og-nexus.png e ícones PWA a partir do favicon.png original (sem trocar a logo).
 * Uso: node scripts/generate-brand-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
/** Fonte da marca — favicon.png original (logo metálico circular). */
const faviconPath = path.join(root, 'public/img/favicon.png');

async function ogImage() {
  const w = 1200;
  const h = 630;
  const logo = await sharp(faviconPath)
    .resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Ícone PWA com a logo inteira — escala para caber no quadrado sem cortar. */
async function pwaIconFromFavicon(size, contentScale = 0.9) {
  const inner = Math.max(1, Math.round(size * contentScale));
  const logo = await sharp(faviconPath)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function writePwaIcon(relativePath, size, contentScale) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, await pwaIconFromFavicon(size, contentScale));
  console.log('OK', relativePath);
}

const ogPath = path.join(root, 'public/img/og-nexus.png');
fs.writeFileSync(ogPath, await ogImage());
console.log('OK', path.relative(root, ogPath));

fs.writeFileSync(path.join(root, 'public/site/img/og-nexus.png'), await ogImage());
console.log('OK public/site/img/og-nexus.png');

await writePwaIcon('public/img/apple-touch-icon.png', 180, 0.9);
await writePwaIcon('public/img/pwa-icon-192.png', 192, 0.9);
await writePwaIcon('public/img/pwa-icon-512.png', 512, 0.9);
await writePwaIcon('public/img/pwa-icon-maskable-512.png', 512, 0.78);

await writePwaIcon('public/site/img/apple-touch-icon.png', 180, 0.9);
await writePwaIcon('public/site/img/pwa-icon-192.png', 192, 0.9);
