/**
 * Importa foto gerada (Gemini) para thumb da carta.
 * Redimensiona para 512×512 mantendo proporção 2:3 em fundo escuro.
 *
 * Uso: node scripts/import-drink-photo.mjs --slug blue-lagoon --from ./arte.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { THUMB_BG, THUMB_SIZE, centerDrinkThumb } from './drink-thumb-center.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const thumbsDir = path.join(__dirname, '../public/img/personal/drinks/thumbs');

const args = process.argv.slice(2);
const slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;

if (!slug || !from) {
  console.error('Uso: node scripts/import-drink-photo.mjs --slug <slug> --from <arquivo>');
  process.exit(1);
}

const input = path.resolve(from);
if (!fs.existsSync(input)) {
  console.error('Arquivo não encontrado:', input);
  process.exit(1);
}

const output = path.join(thumbsDir, `${slug}.jpg`);
fs.mkdirSync(thumbsDir, { recursive: true });

const temp = path.join(thumbsDir, `${slug}.tmp.jpg`);

await sharp(input)
  .resize(THUMB_SIZE, THUMB_SIZE, {
    fit: 'contain',
    background: THUMB_BG,
    position: 'centre',
  })
  .jpeg({ quality: 90 })
  .toFile(temp);

await centerDrinkThumb(temp, output);
fs.unlinkSync(temp);

console.log('saved', output);
