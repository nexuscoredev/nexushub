import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '../public/img/personal/drinks');
const outDir = path.join(srcDir, 'thumbs');

/** Recorte padrão — copo no canto inferior esquerdo das artes do Google Sites. */
const DEFAULT_CROP = {
  leftRatio: 0,
  topRatio: 0.28,
  widthRatio: 0.46,
  heightRatio: 0.72,
};

/** Ajustes finos por drink (posição do copo varia na arte). */
const CROP_OVERRIDES = {
  'dry-martini': { topRatio: 0.24, widthRatio: 0.52, heightRatio: 0.76 },
  'vesper-martini': { topRatio: 0.24, widthRatio: 0.52, heightRatio: 0.76 },
  'cuba-libre': { topRatio: 0.26, widthRatio: 0.48, heightRatio: 0.74 },
  'moscow-mule': { topRatio: 0.26, widthRatio: 0.44, heightRatio: 0.74 },
  'daiquiri': { topRatio: 0.22, widthRatio: 0.55, heightRatio: 0.78 },
  'negroni': { topRatio: 0.26, widthRatio: 0.5, heightRatio: 0.74 },
  'margarita': { topRatio: 0.38, widthRatio: 0.38, heightRatio: 0.62 },
  'margarita-blue': { topRatio: 0.38, widthRatio: 0.38, heightRatio: 0.62 },
  'blue-lagoon': { topRatio: 0.3, widthRatio: 0.42, heightRatio: 0.7 },
  'bloody-mary': { topRatio: 0.24, widthRatio: 0.44, heightRatio: 0.76 },
  'caipitudo': { topRatio: 0.32, widthRatio: 0.4, heightRatio: 0.68 },
  'caipiroska-de-limao': { topRatio: 0.32, widthRatio: 0.4, heightRatio: 0.68 },
  'caipiroska-de-maracuja': { topRatio: 0.32, widthRatio: 0.4, heightRatio: 0.68 },
  'cozumel': { topRatio: 0.3, widthRatio: 0.42, heightRatio: 0.7 },
};

const THUMB_SIZE = 512;
const THUMB_BG = { r: 8, g: 8, b: 10 };

fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter((name) => name.endsWith('.jpg') && name !== 'banner.jpg');

for (const file of files) {
  const slug = file.replace(/\.jpg$/, '');
  const crop = { ...DEFAULT_CROP, ...CROP_OVERRIDES[slug] };
  const input = path.join(srcDir, file);
  const output = path.join(outDir, file);

  const meta = await sharp(input).metadata();
  const width = meta.width ?? 382;
  const height = meta.height ?? 382;

  const left = Math.max(0, Math.round(width * crop.leftRatio));
  const top = Math.max(0, Math.round(height * crop.topRatio));
  const extractWidth = Math.min(width - left, Math.round(width * crop.widthRatio));
  const extractHeight = Math.min(height - top, Math.round(height * crop.heightRatio));

  await sharp(input)
    .extract({ left, top, width: extractWidth, height: extractHeight })
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'contain',
      background: THUMB_BG,
      position: 'bottom',
    })
    .jpeg({ quality: 88 })
    .toFile(output);

  console.log('thumb', slug);
}

console.log('done', outDir);
