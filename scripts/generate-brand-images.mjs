/**
 * Gera favicon.png e og-nexus.png com fundo preto a partir do SVG da marca.
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

async function pngOnBlack(size, logoScale = 0.74) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(markSvg).resize(logoSize, logoSize).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

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

const ogPath = path.join(root, 'public/img/og-nexus.png');
fs.writeFileSync(ogPath, await ogImage());
console.log('OK', path.relative(root, ogPath));

// Cópia OG para o site estático (path relativo em /site/)
fs.writeFileSync(path.join(root, 'public/site/img/og-nexus.png'), await ogImage());
console.log('OK public/site/img/og-nexus.png');
