import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '../public/img/personal/drinks');
const outDir = path.join(srcDir, 'thumbs');

/** Recorte do copo — canto inferior esquerdo das artes do Google Sites. */
const CROP = {
  leftRatio: 0,
  topRatio: 0.46,
  widthRatio: 0.38,
  heightRatio: 0.54,
};

const THUMB_SIZE = 512;

fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter((name) => name.endsWith('.jpg') && name !== 'banner.jpg');

for (const file of files) {
  const slug = file.replace(/\.jpg$/, '');
  const input = path.join(srcDir, file);
  const output = path.join(outDir, file);

  const meta = await sharp(input).metadata();
  const left = Math.round(meta.width * CROP.leftRatio);
  const top = Math.round(meta.height * CROP.topRatio);
  const width = Math.round(meta.width * CROP.widthRatio);
  const height = Math.round(meta.height * CROP.heightRatio);

  await sharp(input)
    .extract({ left, top, width, height })
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toFile(output);

  console.log('thumb', slug);
}

console.log('done', outDir);
