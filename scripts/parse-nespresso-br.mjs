import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const ns = await fetch('https://www.nespresso.com/br/pt/order/capsules/original', {
  headers: { 'User-Agent': UA },
});
const html = await ns.text();

// Try various JSON patterns
const patterns = [
  /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
  /"products"\s*:\s*(\[[\s\S]*?\])\s*,\s*"/,
  /"coffeeList"\s*:\s*(\[[\s\S]*?\])/,
];

for (const p of patterns) {
  const m = html.match(p);
  if (m) console.log('Pattern hit', p.source.slice(0, 40), m[1].slice(0, 100));
}

// Extract product-like JSON blocks with title + intensity
const titleBlocks = [...html.matchAll(/"title"\s*:\s*"([^"]+)"[\s\S]{0,500}?"intensity"\s*:\s*(\d+)/g)];
console.log('\ntitle+intensity pairs', titleBlocks.length);
for (const [, title, intensity] of titleBlocks.slice(0, 50)) {
  console.log(`  ${intensity} — ${title}`);
}

// slug patterns
const slugTitle = [...html.matchAll(/"slug"\s*:\s*"([^"]+)"[\s\S]{0,300}?"title"\s*:\s*"([^"]+)"/g)];
console.log('\nslug+title', slugTitle.length);
const seen = new Set();
for (const [, slug, title] of slugTitle) {
  if (seen.has(slug)) continue;
  seen.add(slug);
  console.log(`  ${slug} — ${title}`);
}

// sys_master with nearby title
const imgBlocks = [...html.matchAll(/sys_master\/public\/\d+\/([^"?]+\.(?:png|jpg|webp))[^"']{0,200}/gi)];
const uniqueImgs = [...new Set(imgBlocks.map((m) => m[1]))];
console.log('\nunique image filenames', uniqueImgs.length);
for (const img of uniqueImgs.filter((i) => /coffee|espresso|lungo|ristretto|arpeggio|decaf|barista|ispirazione/i.test(i)).slice(0, 60)) {
  console.log(' ', img);
}

// Save snippet for manual inspection
const idx = html.indexOf('ispirazione-ristretto');
if (idx > 0) writeFileSync('scripts/_nespresso-snippet.html', html.slice(idx - 500, idx + 3000));
console.log('\nWrote scripts/_nespresso-snippet.html');
