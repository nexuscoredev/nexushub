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
/** Fonte da marca para OG — não sobrescreve favicon (hero/nav usam o PNG original). */
const markSvg = fs.readFileSync(path.join(root, 'public/logo-nexus-mark.svg'));
const faviconPath = path.join(root, 'public/img/favicon.png');

async function ogImage() {
  const w = 1200;
  const h = 630;
  const logo = await sharp(markSvg).resize(420, 420).png().toBuffer();
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

/** Recorte central do favicon.png — mesma logo, só preenche melhor o quadrado do app. */
async function pwaIconFromFavicon(size, zoom = 1.18) {
  const meta = await sharp(faviconPath).metadata();
  const base = meta.width ?? 512;
  const cropSize = Math.max(1, Math.round(base / zoom));
  const offset = Math.round((base - cropSize) / 2);
  return sharp(faviconPath)
    .extract({ left: offset, top: offset, width: cropSize, height: cropSize })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function writePwaIcon(relativePath, size, zoom) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, await pwaIconFromFavicon(size, zoom));
  console.log('OK', relativePath);
}

const ogPath = path.join(root, 'public/img/og-nexus.png');
fs.writeFileSync(ogPath, await ogImage());
console.log('OK', path.relative(root, ogPath));

fs.writeFileSync(path.join(root, 'public/site/img/og-nexus.png'), await ogImage());
console.log('OK public/site/img/og-nexus.png');

await writePwaIcon('public/img/apple-touch-icon.png', 180, 1.18);
await writePwaIcon('public/img/pwa-icon-192.png', 192, 1.18);
await writePwaIcon('public/img/pwa-icon-512.png', 512, 1.18);
await writePwaIcon('public/img/pwa-icon-maskable-512.png', 512, 1.02);

await writePwaIcon('public/site/img/apple-touch-icon.png', 180, 1.18);
await writePwaIcon('public/site/img/pwa-icon-192.png', 192, 1.18);
