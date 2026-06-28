/**
 * Gera prompts Gemini no padrão fotográfico da carta.
 *
 * Uso:
 *   node scripts/drink-photo-prompts.mjs --slug mojito
 *   node scripts/drink-photo-prompts.mjs --all
 *   node scripts/drink-photo-prompts.mjs --all --json > prompts.json
 */
import { DRINK_PHOTO_VISUALS, buildDrinkPhotoPrompt } from './drink-photo-style.mjs';
import { IBA_DRINK_VISUALS, visualForDrinkSlug } from './iba-drink-visuals.mjs';
import { DRINK_THUMB_MAP } from './drink-thumb-map.mjs';

function visualForSlug(slug) {
  if (DRINK_PHOTO_VISUALS[slug]) return DRINK_PHOTO_VISUALS[slug];
  return visualForDrinkSlug(slug);
}

function allThumbSlugs() {
  const slugs = new Set([
    ...Object.keys(DRINK_PHOTO_VISUALS),
    ...Object.keys(IBA_DRINK_VISUALS),
    ...Object.keys(DRINK_THUMB_MAP),
    ...Object.values(DRINK_THUMB_MAP),
  ]);
  return [...slugs].sort();
}

const args = process.argv.slice(2);
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const all = args.includes('--all');
const asJson = args.includes('--json');

if (!slugArg && !all) {
  console.log('Uso: node scripts/drink-photo-prompts.mjs --slug mojito | --all [--json]');
  process.exit(1);
}

const slugs = slugArg ? [slugArg] : allThumbSlugs();
const entries = slugs.map((slug) => ({
  slug,
  prompt: buildDrinkPhotoPrompt(visualForSlug(slug)),
}));

if (asJson) {
  console.log(JSON.stringify(entries, null, 2));
} else if (slugArg) {
  console.log(entries[0].prompt);
} else {
  for (const { slug, prompt } of entries) {
    console.log(`\n# ${slug}\n${prompt}\n`);
  }
}
