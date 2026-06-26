/**
 * Gera prompts Gemini no padrão fotográfico da carta.
 *
 * Uso:
 *   node scripts/drink-photo-prompts.mjs --slug mojito
 *   node scripts/drink-photo-prompts.mjs --all
 *   node scripts/drink-photo-prompts.mjs --all --json > prompts.json
 */
import { DRINK_THUMB_MAP } from './drink-thumb-map.mjs';
import {
  DRINK_PHOTO_VISUALS,
  buildDrinkPhotoPrompt,
  titleFromSlug,
} from './drink-photo-style.mjs';

function visualForSlug(slug) {
  if (DRINK_PHOTO_VISUALS[slug]) return DRINK_PHOTO_VISUALS[slug];

  const source = DRINK_THUMB_MAP[slug] ?? slug;
  const base = DRINK_PHOTO_VISUALS[source];
  if (base) {
    return { ...base, title: titleFromSlug(slug) };
  }

  return {
    title: titleFromSlug(slug),
    glass: 'premium crystal cocktail glass',
    liquid: 'beautifully mixed cocktail',
    garnish: 'appropriate fresh garnish',
  };
}

function allThumbSlugs() {
  const slugs = new Set(Object.keys(DRINK_THUMB_MAP));
  for (const source of Object.values(DRINK_THUMB_MAP)) slugs.add(source);
  for (const source of Object.keys(DRINK_PHOTO_VISUALS)) slugs.add(source);
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
