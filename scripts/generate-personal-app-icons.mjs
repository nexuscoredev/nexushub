/**
 * Gera ícones quadrados (512px) para apps pessoais — retina-ready.
 * Drinks: recorte central do banner. Adega/PC: render SVG → PNG.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/img/personal/apps');
const ICON_SIZE = 512;

const ADEGA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="10" y1="6" x2="54" y2="58">
      <stop offset="0%" stop-color="#450a0a"/>
      <stop offset="50%" stop-color="#1c0509"/>
      <stop offset="100%" stop-color="#0a0306"/>
    </linearGradient>
    <linearGradient id="wine" x1="28" y1="22" x2="36" y2="42">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="40%" stop-color="#be123c"/>
      <stop offset="100%" stop-color="#4c0519"/>
    </linearGradient>
    <linearGradient id="label" x1="27" y1="30" x2="37" y2="36">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#bg)"/>
  <rect x="8" y="44" width="48" height="4" rx="1.4" fill="#92400e"/>
  <path d="M25.5 18h13c2 0 3.6 1.65 3.6 3.65v20.5c0 2-1.6 3.65-3.6 3.65h-13c-2 0-3.6-1.65-3.6-3.65V21.65c0-2 1.6-3.65 3.6-3.65Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.32)" stroke-width="0.85"/>
  <path d="M26.4 23h11.2c.65 0 1.15.55 1.15 1.15v17.8c0 .65-.5 1.15-1.15 1.15H26.4c-.65 0-1.15-.5-1.15-1.15V24.15c0-.6.5-1.15 1.15-1.15Z" fill="url(#wine)"/>
  <rect x="26.2" y="29.5" width="11.6" height="6.2" rx="0.8" fill="url(#label)"/>
</svg>`;

async function writeIcon(name, pipeline) {
  const outPath = path.join(outDir, name);
  await pipeline
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'cover' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`✓ ${name} (${meta.width}x${meta.height})`);
}

await fs.mkdir(outDir, { recursive: true });

const bannerPath = path.join(root, 'public/img/personal/drinks/banner.png');
await writeIcon(
  'drinks-carta.png',
  sharp(bannerPath).resize(ICON_SIZE, ICON_SIZE, { fit: 'cover', position: 'centre' }),
);

await writeIcon('adega.png', sharp(Buffer.from(ADEGA_SVG)).resize(ICON_SIZE, ICON_SIZE));

console.log('Ícones gerados em public/img/personal/apps/');
