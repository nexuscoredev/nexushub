/**
 * Resolve imagens Dolce Gusto sem selo "10x" (mobile-hero → xicara-reta / capsula).
 * node scripts/resolve-dg-clean-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const manifest = JSON.parse(readFileSync(join(__dirname, 'coffee-image-manifest.json'), 'utf8'));
const dg = manifest['dolce-gusto'];

function candidates(url) {
  if (!url) return [];
  const out = new Set([url]);
  const reps = [
    [/mobile[-_]?hero/gi, 'xicara-reta'],
    [/mobile_hero/gi, 'xicara-reta'],
    [/10_capsulas_mobile_hero/gi, '10_capsulas_xicara_reta'],
    [/xicara_e_capsula/gi, 'xicara-reta'],
    [/xicara-reta-reta/gi, 'xicara-reta'],
  ];
  for (const [re, rep] of reps) out.add(url.replace(re, rep));
  // mockup/enxoval often clean box fronts
  if (/mobile/i.test(url)) {
    out.add(url.replace(/\/m\/o\/mobile[^/]*\.(png|jpe?g)/i, '/f/r/frente_6.png'));
  }
  return [...out];
}

async function pickClean(url, slug) {
  for (const c of candidates(url)) {
    try {
      const r = await fetch(c, { headers: { 'User-Agent': UA, Accept: 'image/*' } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.byteLength < 2000) continue;
      return { box: c, bytes: buf.byteLength };
    } catch {
      /* next */
    }
  }
  return { box: url, bytes: 0 };
}

const resolved = [];
for (const item of dg) {
  const hit = await pickClean(item.box, item.slug);
  resolved.push({ ...item, box: hit.box, _wasMobile: /mobile[-_]?hero|10_capsulas_mobile/i.test(item.box ?? '') });
  if (hit.box !== item.box) console.log(`✓ ${item.name}: ${item.box?.split('/').pop()} → ${hit.box.split('/').pop()}`);
  else if (/mobile[-_]?hero|10_capsulas_mobile/i.test(item.box ?? '')) console.log(`⚠ ${item.name}: kept mobile-hero (no alt)`);
}

manifest['dolce-gusto'] = resolved.map(({ _wasMobile, ...rest }) => rest);
writeFileSync(join(__dirname, 'coffee-image-manifest.json'), JSON.stringify(manifest, null, 2));

// Update build script map
const catalog = JSON.parse(readFileSync(join(__dirname, '../src/data/coffeeCapsuleCatalog/dolce-gusto.json'), 'utf8'));
const bySlug = Object.fromEntries(resolved.map((r) => [r.slug, r.box]));
let manifestSrc = readFileSync(join(__dirname, 'build-coffee-image-manifest.mjs'), 'utf8');
for (const entry of catalog) {
  const clean = bySlug[entry.slug];
  if (!clean || clean === entry.box) continue;
  // patch DG_BOX_BY_NAME value for entry.name
  const escaped = entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`('${escaped}'\\s*:\\s*')([^']+)(')`, 'g');
  if (re.test(manifestSrc)) {
    manifestSrc = manifestSrc.replace(re, `$1${clean}$3`);
    console.log('patched map', entry.name);
  }
}
writeFileSync(join(__dirname, 'build-coffee-image-manifest.mjs'), manifestSrc);
console.log('Done', resolved.filter((r) => !/mobile[-_]?hero|10_capsulas_mobile/i.test(r.box)).length, '/', resolved.length, 'clean');
