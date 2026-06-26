/**
 * Recentraliza todas as thumbs da carta (corrige deslocamento para baixo).
 * Uso: node scripts/recenter-drink-thumbs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { centerDrinkThumb } from './drink-thumb-center.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const thumbsDir = path.join(__dirname, '../public/img/personal/drinks/thumbs');

const files = fs
  .readdirSync(thumbsDir)
  .filter((name) => name.endsWith('.jpg'))
  .sort();

let ok = 0;
let failed = 0;

for (const file of files) {
  const filePath = path.join(thumbsDir, file);
  try {
    await centerDrinkThumb(filePath);
    ok += 1;
    console.log('centered', file);
  } catch (err) {
    failed += 1;
    console.error('failed', file, err.message);
  }
}

console.log(`done: ${ok} centered, ${failed} failed`);
