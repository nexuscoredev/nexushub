/**
 * Auditoria: catálogo vs imagens vs totais esperados.
 * node scripts/audit-coffee-catalog.mjs
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG = join(ROOT, 'src/data/coffeeCapsuleCatalog');
const IMG = join(ROOT, 'public/img/personal/coffee/catalog');

function md5(file) {
  return createHash('md5').update(readFileSync(file)).digest('hex');
}

function auditSystem(system) {
  const entries = JSON.parse(readFileSync(join(CATALOG, `${system}.json`), 'utf8'));
  const imgDir = join(IMG, system);
  const issues = [];
  let dup = 0;
  let missingCap = 0;
  let missingBox = 0;
  let tinyCap = 0;

  for (const e of entries) {
    const cap = join(imgDir, e.slug, 'capsule.jpg');
    const box = join(imgDir, e.slug, 'box.jpg');
    if (!existsSync(cap)) {
      missingCap++;
      issues.push(`sem capsule.jpg: ${e.slug} (${e.name})`);
    } else if (readFileSync(cap).length < 7_000) {
      tinyCap++;
      issues.push(`capsule pequena: ${e.slug} (${readFileSync(cap).length} B)`);
    }
    if (!existsSync(box)) {
      missingBox++;
      issues.push(`sem box.jpg: ${e.slug}`);
    }
    if (existsSync(cap) && existsSync(box) && md5(cap) === md5(box)) {
      dup++;
      issues.push(`capsule=box: ${e.slug} (${e.name})`);
    }
    if (e.imagesPending) issues.push(`imagesPending: ${e.slug}`);
  }

  const dirs = existsSync(imgDir)
    ? readdirSync(imgDir).filter((d) => existsSync(join(imgDir, d, 'capsule.jpg')))
    : [];
  const slugs = new Set(entries.map((e) => e.slug));
  const orphanDirs = dirs.filter((d) => !slugs.has(d));

  return { system, count: entries.length, missingCap, missingBox, dup, tinyCap, issues, orphanDirs };
}

const systems = ['dolce-gusto', 'nespresso', 'tres-coracoes'];
const results = systems.map(auditSystem);

console.log('=== RESUMO ===\n');
let total = 0;
for (const r of results) {
  total += r.count;
  const ns = r.system === 'nespresso';
  const pure = ns
    ? JSON.parse(readFileSync(join(CATALOG, 'nespresso.json'), 'utf8')).filter(
        (e) => !e.slug.startsWith('3c-'),
      ).length
    : null;
  console.log(`${r.system}:`);
  console.log(`  catálogo: ${r.count}${pure != null ? ` (Nespresso puro: ${pure}, 3C compat: ${r.count - pure})` : ''}`);
  console.log(`  sem capsule: ${r.missingCap} | capsule=box: ${r.dup} | capsule tiny: ${r.tinyCap}`);
  if (r.orphanDirs.length) console.log(`  pastas órfãs: ${r.orphanDirs.join(', ')}`);
  console.log('');
}
console.log(`Total catálogo: ${total}`);
console.log('\nEsperado (referência): DG ~53 | Nespresso ~39 | TRES ~42\n');

console.log('=== PROBLEMAS ===\n');
for (const r of results) {
  if (!r.issues.length) {
    console.log(`${r.system}: nenhum problema de arquivo`);
    continue;
  }
  console.log(`--- ${r.system} (${r.issues.length}) ---`);
  for (const i of r.issues) console.log(' ', i);
  console.log('');
}
