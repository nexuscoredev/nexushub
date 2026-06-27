/**
 * Grava imagens base64 vindas do browser (CDP) e atualiza catálogo.
 * Uso: node scripts/save-coffee-browser-payload.mjs <payload.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DIR = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');

const payloadFile = process.argv[2];
if (!payloadFile) {
  console.error('Uso: node scripts/save-coffee-browser-payload.mjs <payload.json>');
  process.exit(1);
}

const payload = JSON.parse(readFileSync(payloadFile, 'utf8'));
const updatedSystems = new Map();

for (const item of payload) {
  if (item.error || !item.boxB64) {
    console.warn(`✗ ${item.system}/${item.slug}: ${item.error ?? 'sem dados'}`);
    continue;
  }
  const outDir = join(IMG_ROOT, item.system, item.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'box.jpg'), Buffer.from(item.boxB64, 'base64'));
  writeFileSync(join(outDir, 'capsule.jpg'), Buffer.from(item.capB64 ?? item.boxB64, 'base64'));

  if (!updatedSystems.has(item.system)) {
    updatedSystems.set(
      item.system,
      JSON.parse(readFileSync(join(CATALOG_DIR, `${item.system}.json`), 'utf8')),
    );
  }
  const entry = updatedSystems.get(item.system).find((e) => e.slug === item.slug);
  if (entry) {
    entry.images = {
      box: `/img/personal/coffee/catalog/${item.system}/${item.slug}/box.jpg`,
      capsule: `/img/personal/coffee/catalog/${item.system}/${item.slug}/capsule.jpg`,
    };
    entry.imagesPending = false;
    if (item.catalogUrl) entry.catalogUrl = item.catalogUrl;
  }
  console.log(`✓ ${item.system}/${item.slug}`);
}

for (const [system, entries] of updatedSystems) {
  writeFileSync(join(CATALOG_DIR, `${system}.json`), `${JSON.stringify(entries, null, 2)}\n`);
}
