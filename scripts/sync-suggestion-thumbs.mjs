/**
 * Sincroniza thumbs das sugestões a partir do mapeamento semântico.
 * Uso: node scripts/sync-suggestion-thumbs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRINK_THUMB_MAP } from './drink-thumb-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const thumbsDir = path.join(__dirname, '../public/img/personal/drinks/thumbs');

let copied = 0;
let skipped = 0;
let failed = 0;

for (const [dest, source] of Object.entries(DRINK_THUMB_MAP)) {
  const from = path.join(thumbsDir, `${source}.jpg`);
  const to = path.join(thumbsDir, `${dest}.jpg`);

  if (!fs.existsSync(from)) {
    console.error('missing source', source, 'for', dest);
    failed += 1;
    continue;
  }

  if (dest === source && fs.existsSync(to)) {
    skipped += 1;
    continue;
  }

  fs.copyFileSync(from, to);
  copied += 1;
  if (dest !== source) {
    console.log(dest, '<-', source);
  }
}

console.log(`done: ${copied} copied, ${skipped} unchanged, ${failed} failed`);

if (failed > 0) process.exitCode = 1;
