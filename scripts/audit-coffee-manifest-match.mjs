/**
 * Detecta produtos cujo matchManifest (fuzzy) aponta para slug errado.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/starbucks\s+/gi, '')
    .replace(/®/g, '')
    .replace(/\b10\s*c[aá]psulas?\b/gi, '')
    .replace(/embalagem\s+kopenhagen\s+/i, '')
    .replace(/com capsula x\d+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchManifestOld(entry, manifestList) {
  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
  ];
  for (const item of manifestList) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey || k.includes(itemKey) || itemKey.includes(k))) {
      return item;
    }
  }
  return manifestList.find((m) => m.slug === entry.slug) ?? null;
}

function matchManifestFixed(entry, manifestList) {
  const bySlug = manifestList.find((m) => m.slug === entry.slug);
  if (bySlug) return bySlug;

  const keys = [
    normalizeName(entry.name),
    normalizeName(`${entry.brand ?? ''} ${entry.name}`),
  ];
  for (const item of manifestList) {
    const itemKey = normalizeName(item.name);
    if (keys.some((k) => k === itemKey)) return item;
  }
  return null;
}

const manifest = JSON.parse(readFileSync(join(__dirname, 'coffee-image-manifest.json'), 'utf8'));

for (const system of ['dolce-gusto', 'nespresso', 'tres-coracoes']) {
  const entries = JSON.parse(
    readFileSync(join(__dirname, `../src/data/coffeeCapsuleCatalog/${system}.json`), 'utf8'),
  );
  const list = manifest[system] ?? [];
  const wrongOld = [];
  const wrongFixed = [];
  for (const entry of entries) {
    const oldHit = matchManifestOld(entry, list);
    const fixedHit = matchManifestFixed(entry, list);
    if (oldHit && oldHit.slug !== entry.slug) {
      wrongOld.push(`${entry.slug} -> ${oldHit.slug}`);
    }
    if (!fixedHit?.box) {
      wrongFixed.push(`${entry.slug} (sem box)`);
    } else if (fixedHit.slug !== entry.slug) {
      wrongFixed.push(`${entry.slug} -> ${fixedHit.slug}`);
    }
  }
  console.log(`\n${system}:`);
  console.log(`  old fuzzy wrong: ${wrongOld.length}`);
  console.log(`  fixed matcher wrong/missing: ${wrongFixed.length}`);
  if (wrongFixed.length) wrongFixed.forEach((w) => console.log(`    ${w}`));
}
