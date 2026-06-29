/**
 * Corrige URLs de cápsula DG: m/o/capsula_*.png → c/a/capsula_*.png
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, 'coffee-image-manifest.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/** URLs confirmadas fora do padrão m/o/capsula_*. */
const MANUAL_CAPSULE_URLS = {
  'chococino-nestle':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/c/h/chococino_capsula.png',
};

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let fixed = 0;
let failed = 0;

for (const item of manifest['dolce-gusto']) {
  if (MANUAL_CAPSULE_URLS[item.slug]) {
    item.capsule = MANUAL_CAPSULE_URLS[item.slug];
    fixed++;
    console.log(`✓ ${item.slug} (manual)`);
    continue;
  }

  const cap = item.capsule;
  if (!cap || !cap.includes('/m/o/capsula')) continue;

  const alt = cap.replace('/m/o/capsula', '/c/a/capsula');
  const res = await fetch(alt, { headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 50_000) {
    item.capsule = alt;
    fixed++;
    console.log(`✓ ${item.slug} → ${buf.length} B`);
  } else {
    failed++;
    console.warn(`✗ ${item.slug}: ${alt} (${buf.length} B)`);
  }
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`\n${fixed} corrigidas, ${failed} falhas.`);
