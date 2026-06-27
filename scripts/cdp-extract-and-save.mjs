/**
 * Extrai payload do arquivo de resposta CDP e salva imagens.
 * node scripts/cdp-extract-and-save.mjs <cdp-response.json>
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const cdpFile = process.argv[2];
if (!cdpFile) {
  console.error('Uso: node scripts/cdp-extract-and-save.mjs <cdp-response.json>');
  process.exit(1);
}

const cdp = JSON.parse(readFileSync(cdpFile, 'utf8'));
const val = cdp.result?.result?.value ?? cdp.result?.value;
if (!val) {
  console.error('Resposta CDP sem valor');
  process.exit(1);
}

const tmp = join(dirname(fileURLToPath(import.meta.url)), 'coffee-download-batches', '_last.payload.json');
writeFileSync(tmp, val);
const r = spawnSync('node', ['scripts/save-coffee-browser-payload.mjs', tmp], {
  cwd: join(dirname(fileURLToPath(import.meta.url)), '..'),
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
