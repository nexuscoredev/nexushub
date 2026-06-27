/**
 * Gera expressão JS para fetch no browser (usar com CDP Runtime.evaluate).
 * node scripts/make-browser-fetch-expression.mjs scripts/coffee-download-batches/batch-00.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const batch = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const expr = `(async () => {
  const items = ${JSON.stringify(batch)};
  function bufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }
  function deriveCapsule(box) {
    const reps = [
      [/mobile[-_]?hero[^/]*\\.(png|jpe?g|webp)/i, 'capsula.$1'],
      [/mobile_hero[^/]*\\.(png|jpe?g|webp)/i, 'capsula.$1'],
      [/frente[^/]*\\.(png|jpe?g|webp)/i, 'capsula.$1'],
      [/mockups?[^/]*\\.(png|jpe?g|webp)/i, 'capsula.$1'],
      [/enxoval[^/]*\\.(png|jpe?g|webp)/i, 'capsula.$1'],
    ];
    const out = new Set();
    for (const [re, rep] of reps) out.add(box.replace(re, rep));
    if (/-3-coracoes\\.png$/i.test(box)) out.add(box.replace(/\\.png$/i, '-02.png'));
    return [...out];
  }
  async function pickCapsule(box, explicit) {
    const candidates = explicit ? [explicit, ...deriveCapsule(box)] : deriveCapsule(box);
    for (const url of candidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const buf = await r.arrayBuffer();
        if (buf.byteLength > 12000) return { url, buf };
      } catch {}
    }
    const r = await fetch(box);
    return { url: box, buf: await r.arrayBuffer() };
  }
  const results = [];
  for (const item of items) {
    try {
      const boxR = await fetch(item.box);
      if (!boxR.ok) throw new Error('box HTTP ' + boxR.status);
      const boxBuf = await boxR.arrayBuffer();
      const cap = await pickCapsule(item.box, item.capsule);
      results.push({
        system: item.system,
        slug: item.slug,
        catalogUrl: item.catalogUrl,
        boxB64: bufToB64(boxBuf),
        capB64: bufToB64(cap.buf),
      });
    } catch (e) {
      results.push({ system: item.system, slug: item.slug, error: String(e.message || e) });
    }
  }
  return JSON.stringify(results);
})()`;

const out = process.argv[3] ?? process.argv[2].replace(/\.json$/, '.expr.txt');
writeFileSync(out, expr);
console.log('Wrote', out, 'length', expr.length);
