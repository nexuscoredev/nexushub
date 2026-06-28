import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function hash(buf) {
  let h = 0;
  for (const b of buf) h = ((h << 5) - h + b) & 0xffffffff;
  return h >>> 0;
}

const systems = ['dolce-gusto', 'nespresso', 'tres-coracoes'];
const tiny = [];
const missing = [];
const dupGroups = new Map();

for (const sys of systems) {
  const root = join('public/img/personal/coffee/catalog', sys);
  for (const slug of readdirSync(root)) {
    for (const file of ['box.jpg', 'capsule.jpg']) {
      const p = join(root, slug, file);
      try {
        const buf = readFileSync(p);
        const size = buf.byteLength;
        if (size < 12_000) tiny.push({ sys, slug, file, size });
        const key = `${sys}/${file}/${hash(buf)}`;
        if (!dupGroups.has(key)) dupGroups.set(key, []);
        dupGroups.get(key).push(slug);
      } catch {
        missing.push({ sys, slug, file });
      }
    }
  }
}

const dups = [...dupGroups.entries()].filter(([, slugs]) => slugs.length > 1);

console.log('tiny', tiny.length);
console.log('missing', missing.length);
console.log('duplicate groups', dups.length);

if (tiny.length) {
  console.log('\nTiny files:');
  tiny.forEach((b) => console.log(`  ${b.sys}/${b.slug}/${b.file} ${b.size}B`));
}

if (dups.length) {
  console.log('\nDuplicate images (same bytes, different products):');
  for (const [key, slugs] of dups.sort((a, b) => b[1].length - a[1].length)) {
    const [, file] = key.split('/');
    console.log(`  ${file}: ${slugs.join(', ')}`);
  }
}

process.exit(tiny.length || dups.length ? 1 : 0);

