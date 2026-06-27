/**
 * Gera lotes de download a partir de coffee-image-manifest.json
 * node scripts/generate-coffee-download-batches.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, 'coffee-image-manifest.json'), 'utf8'));
const outDir = join(__dirname, 'coffee-download-batches');
mkdirSync(outDir, { recursive: true });

const all = [];
for (const [system, items] of Object.entries(manifest)) {
  for (const item of items) {
    if (!item.box) continue;
    all.push({ system, ...item });
  }
}

const BATCH = 12;
let batchIndex = 0;
for (let i = 0; i < all.length; i += BATCH) {
  const chunk = all.slice(i, i + BATCH);
  const file = join(outDir, `batch-${String(batchIndex).padStart(2, '0')}.json`);
  writeFileSync(file, JSON.stringify(chunk, null, 2));
  console.log(file, chunk.length);
  batchIndex++;
}
console.log(`Total: ${all.length} itens em ${batchIndex} lotes`);
