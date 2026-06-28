/**
 * Regenera thumbs únicos a partir das artes-base + tint por drink.
 * Substitui cópias idênticas do sync-suggestion-thumbs.mjs.
 *
 * Uso: node scripts/regenerate-unique-drink-thumbs.mjs [--slug aviation]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { DRINK_THUMB_MAP } from './drink-thumb-map.mjs';
import { tintForDrinkSlug } from './iba-drink-visuals.mjs';
import { centerDrinkThumb, THUMB_BG } from './drink-thumb-center.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const thumbsDir = path.join(__dirname, '../public/img/personal/drinks/thumbs');

function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function sourceForSlug(slug) {
  return DRINK_THUMB_MAP[slug] ?? slug;
}

async function regenerateThumb(slug) {
  const source = sourceForSlug(slug);
  const input = path.join(thumbsDir, `${source}.jpg`);
  const output = path.join(thumbsDir, `${slug}.jpg`);

  if (!fs.existsSync(input)) {
    throw new Error(`fonte ausente: ${source} (para ${slug})`);
  }

  if (slug === source && fs.existsSync(output)) {
    return { slug, skipped: true };
  }

  const tint = tintForDrinkSlug(slug);
  const h = hashSlug(slug);
  const rotate = ((h % 9) - 4) * 0.35;
  const meta = await sharp(input).metadata();
  const cropPad = Math.round(Math.min(meta.width ?? 512, meta.height ?? 512) * 0.04 * (1 + (h % 5)));

  let pipeline = sharp(input)
    .rotate(rotate, { background: THUMB_BG })
    .extract({
      left: Math.min(cropPad, Math.max(0, (meta.width ?? 512) - 1)),
      top: Math.min(cropPad, Math.max(0, (meta.height ?? 512) - 1)),
      width: Math.max(1, (meta.width ?? 512) - cropPad * 2),
      height: Math.max(1, (meta.height ?? 512) - cropPad * 2),
    })
    .modulate({
      brightness: tint.brightness,
      saturation: tint.saturation,
      hue: tint.hue,
    });

  const temp = path.join(thumbsDir, `${slug}.tmp.jpg`);
  await pipeline.jpeg({ quality: 92 }).toFile(temp);
  await centerDrinkThumb(temp, output);
  fs.unlinkSync(temp);

  return { slug, source, skipped: false };
}

const slugArg = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null;

const slugs = slugArg
  ? [slugArg]
  : [...new Set([...Object.keys(DRINK_THUMB_MAP), ...Object.values(DRINK_THUMB_MAP)])].sort();

let ok = 0;
let skipped = 0;
let failed = 0;

for (const slug of slugs) {
  try {
    const result = await regenerateThumb(slug);
    if (result.skipped) {
      skipped += 1;
    } else {
      ok += 1;
      if (sourceForSlug(slug) !== slug) {
        console.log(`${slug} <- ${sourceForSlug(slug)} (tint)`);
      }
    }
  } catch (err) {
    failed += 1;
    console.error(`${slug}:`, err.message);
  }
}

console.log(`done: ${ok} regenerated, ${skipped} unchanged, ${failed} failed`);
if (failed) process.exitCode = 1;
