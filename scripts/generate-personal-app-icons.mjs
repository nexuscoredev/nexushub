/**
 * Gera ícones quadrados (1024px) a partir das artes oficiais em apps/source/.
 * Mantém máxima qualidade: PNG lossless, kernel lanczos3, sem recompressão desnecessária.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'public/img/personal/apps/source');
const outDir = path.join(root, 'public/img/personal/apps');
const ICON_SIZE = 1024;

const PNG_OPTIONS = {
  compressionLevel: 3,
  adaptiveFiltering: true,
  effort: 7,
};

async function writeSquareIcon(name, inputPath) {
  const outPath = path.join(outDir, name);
  const meta = await sharp(inputPath).metadata();
  const isSquare = meta.width === meta.height;

  if (isSquare && meta.width >= ICON_SIZE) {
    await sharp(inputPath).png(PNG_OPTIONS).toFile(outPath);
  } else {
    await sharp(inputPath)
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp.kernel.lanczos3,
      })
      .png(PNG_OPTIONS)
      .toFile(outPath);
  }

  const out = await sharp(outPath).metadata();
  console.log(`✓ ${name} (${out.width}x${out.height})`);
}

await fs.mkdir(outDir, { recursive: true });

await writeSquareIcon('drinks-carta.png', path.join(sourceDir, 'drinks-carta-icon.png'));
await writeSquareIcon('adega.png', path.join(sourceDir, 'adega-icon.png'));

const bannerSrc = path.join(sourceDir, 'drinks-carta-banner.png');
const bannerOut = path.join(root, 'public/img/personal/drinks/banner.png');
const bannerMeta = await sharp(bannerSrc).metadata();
await sharp(bannerSrc).png(PNG_OPTIONS).toFile(bannerOut);
console.log(`✓ banner.png (${bannerMeta.width}x${bannerMeta.height}) → public/img/personal/drinks/`);

console.log('Ícones gerados em public/img/personal/apps/');
