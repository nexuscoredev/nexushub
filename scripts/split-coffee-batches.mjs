/**
 * Divide lotes em chunks menores para fetch via browser CDP.
 * node scripts/split-coffee-batches.mjs [chunkSize=4]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const batchDir = join(__dirname, 'coffee-download-batches');
const chunkDir = join(batchDir, 'chunks');
const chunkSize = Number(process.argv[2] ?? 4);
mkdirSync(chunkDir, { recursive: true });

const batches = readdirSync(batchDir)
  .filter((f) => /^batch-\d+\.json$/.test(f))
  .sort();

let chunkIndex = 0;
for (const file of batches) {
  const items = JSON.parse(readFileSync(join(batchDir, file), 'utf8'));
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const name = `chunk-${String(chunkIndex).padStart(3, '0')}.json`;
    writeFileSync(join(chunkDir, name), JSON.stringify(chunk, null, 2));
    chunkIndex++;
  }
}
console.log(`Gerou ${chunkIndex} chunks de até ${chunkSize} itens em ${chunkDir}`);
