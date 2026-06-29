/**
 * Padroniza capsule.jpg do catálogo (crop de compositos + quadrado 512).
 *
 * Uso:
 *   node scripts/normalize-coffee-capsule-images.mjs
 *   node scripts/normalize-coffee-capsule-images.mjs --system tres-coracoes
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCoffeeCapsuleImage } from './coffee-capsule-image.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMG_ROOT = join(ROOT, 'public/img/personal/coffee/catalog');

const systemArg = process.argv.find((a) => a.startsWith('--system='))?.split('=')[1];
const onlySystem = systemArg ?? (process.argv.includes('--system') ? process.argv[process.argv.indexOf('--system') + 1] : null);

function listCapsuleFiles() {
  const files = [];
  for (const system of readdirSync(IMG_ROOT)) {
    if (onlySystem && system !== onlySystem) continue;
    const systemDir = join(IMG_ROOT, system);
    if (!statSync(systemDir).isDirectory()) continue;
    for (const slug of readdirSync(systemDir)) {
      const capsule = join(systemDir, slug, 'capsule.jpg');
      try {
        if (statSync(capsule).isFile()) {
          files.push({ system, slug, path: capsule, key: `${system}/${slug}` });
        }
      } catch {
        /* skip */
      }
    }
  }
  return files.sort((a, b) => a.key.localeCompare(b.key));
}

async function main() {
  const files = listCapsuleFiles();
  let ok = 0;
  let fail = 0;

  for (const file of files) {
    try {
      await normalizeCoffeeCapsuleImage(file.path, file.key);
      ok++;
      console.log(`  ✓ ${file.key}`);
    } catch (err) {
      fail++;
      console.warn(`  ✗ ${file.key}: ${err.message}`);
    }
  }

  console.log(`\n${ok} normalizadas, ${fail} falhas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
