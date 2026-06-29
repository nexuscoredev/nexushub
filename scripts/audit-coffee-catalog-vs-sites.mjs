/**

 * Compara catálogo embutido vs listagens oficiais (sites).

 * node scripts/audit-coffee-catalog-vs-sites.mjs

 */

import { readFileSync } from 'node:fs';

import { join, dirname } from 'node:path';

import { fileURLToPath } from 'node:url';



const __dirname = dirname(fileURLToPath(import.meta.url));

const ROOT = join(__dirname, '..');

const CATALOG = join(ROOT, 'src/data/coffeeCapsuleCatalog');

const UA =

  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';



const NESPRESSO_BR_ALIASES = {

  'fortissio lungo': 'stockholm lungo',

  'vivalto lungo': 'tokyo lungo',

  'linizio lungo': 'vienna lungo',

};



const TRES_LEGACY_NAMES = {

  'espresso suave': 'espresso supremo',

  'espresso classico': 'espresso pleno',

  'lungo intenso': 'espresso vibrante',

  'espresso ristretto': 'espresso gourmet dark roast',

  'cappuccino classico': 'cappuccino classic',

};



const COMPAT_3C_SLUG = {

  '3c-maximo': 'capsula-de-espresso-maximo',

  '3c-espresso-intenso': 'espresso-intenso',

  '3c-cerrado-mineiro': 'espresso-cerrado-mineiro',

  '3c-mogiana-paulista': 'espresso-mogiana-paulista',

  '3c-regioes-colombia': 'capsula-de-espresso-regioes-do-mundo-colombia',

  '3c-regioes-peru': 'capsula-de-espresso-regioes-do-mundo-peru',

  '3c-organico': 'espresso-organico',

  '3c-descafeinado': 'espresso-descafeinado',

};



/** Referência DG (site SPA — extraído jun/2026). */

const DG_SITE_REF = 54;



function norm(value) {

  return value

    .normalize('NFD')

    .replace(/\p{M}/gu, '')

    .toLowerCase()

    .replace(/starbucks\s+/gi, '')

    .replace(/capsula de\s+/gi, '')

    .replace(/tres\s+3\s*coracoes?/gi, '')

    .replace(/tres\s+3cha/gi, '')

    .replace(/®|™/g, '')

    .replace(/[^a-z0-9]+/g, ' ')

    .trim();

}



function mercafeLinkFromUrl(catalogUrl) {

  if (!catalogUrl || !catalogUrl.includes('mercafe.com.br/')) return null;

  const m = catalogUrl.match(/mercafe\.com\.br\/([^/]+)\/p/);

  return m?.[1] ?? null;

}



function loadCatalog(system) {

  return JSON.parse(readFileSync(join(CATALOG, `${system}.json`), 'utf8'));

}



function diffByKey(localItems, siteItems, getLocalKey, getSiteKey, getLocalLabel, getSiteLabel, aliases = {}) {

  const siteMap = new Map(siteItems.map((s) => [getSiteKey(s), s]));

  const onlyLocal = [];

  const matchedSite = new Set();



  for (const item of localItems) {

    let key = getLocalKey(item);

    if (aliases[key]) key = aliases[key];

    if (siteMap.has(key)) {

      matchedSite.add(key);

    } else {

      onlyLocal.push(getLocalLabel(item));

    }

  }



  const onlySite = [...siteMap.entries()]

    .filter(([k]) => !matchedSite.has(k))

    .map(([, s]) => getSiteLabel(s));



  return { onlyLocal, onlySite, localCount: localItems.length, siteCount: siteItems.length };

}



function printDiff(title, result, opts = {}) {

  console.log(`\n=== ${title} ===`);

  console.log(`  Local: ${result.localCount} | Site: ${result.siteCount}`);

  if (result.note) console.log(`  Nota: ${result.note}`);

  if (result.onlyLocal.length) {

    console.log(`  Só no app (${result.onlyLocal.length}):`);

    for (const n of result.onlyLocal.slice(0, opts.maxList ?? 20)) console.log(`    - ${n}`);

    if (result.onlyLocal.length > (opts.maxList ?? 20)) {

      console.log(`    … +${result.onlyLocal.length - (opts.maxList ?? 20)}`);

    }

  } else {

    console.log('  Só no app: nenhum');

  }

  if (result.onlySite.length) {

    console.log(`  Só no site (${result.onlySite.length}):`);

    for (const n of result.onlySite.slice(0, opts.maxList ?? 20)) console.log(`    + ${n}`);

    if (result.onlySite.length > (opts.maxList ?? 20)) {

      console.log(`    … +${result.onlySite.length - (opts.maxList ?? 20)}`);

    }

  } else {

    console.log('  Só no site: nenhum');

  }

  const match =

    result.onlyLocal.length === 0 && result.onlySite.length === 0 && result.localCount === result.siteCount;

  console.log(match ? '  ✓ Catálogo alinhado com o site' : '  ⚠ Divergências encontradas');

  return match;

}



async function fetchNespressoOriginal() {

  const html = await fetch('https://www.nespresso.com/br/pt/order/capsules/original', {

    headers: { 'User-Agent': UA },

  }).then((r) => r.text());



  const products = [];

  const re =

    /\{"id":"erp\.br\.b2c\/prod\/[^"]+","internationalId":"[^"]+","legacyId":"[^"]+","name":"([^"]+)","internationalName":"([^"]*)"(?:,"description":[^,]+)?,"image":\{"url":"([^"]+)"[^}]*\}[^}]*"type":"capsule"[^}]*"headline":"([^"]*)"[^}]*"url":"([^"]+)"[^}]*"intensity":(\d+|null)[^}]*"ranges":\[([^\]]*)\][^}]*"cupSizes":\[([^\]]*)\]/g;



  let m;

  while ((m = re.exec(html)) !== null) {

    const name = m[1];

    if (/^kit\b/i.test(name)) continue;

    products.push({ name, url: m[5], key: norm(name) });

  }

  return products;

}



async function fetchTresMercafe() {

  const out = new Map();

  const queries = [

    'tres coracoes',

    'solucao tres',

    'capsula tres',

    'cha tres',

    'baileys tres',

    'portinari tres',

    'pacoca tres',

    'star wars tres',

    'santa clara tres',

  ];



  for (const q of queries) {

    const url = `https://mercafefaststore.vtexcommercestable.com.br/api/catalog_system/pub/products/search/${encodeURIComponent(q)}?/_from=0&_to=49`;

    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });

    if (!res.ok) continue;

    const data = await res.json();

    for (const p of data) {

      const name = p.productName?.trim();

      const link = p.linkText ?? '';

      if (!name || !link) continue;

      if (!/tres|3\s*corac|3cha|baileys/i.test(`${name} ${link}`)) continue;

      if (/maquina|aparelho|kit|caneca|descalcificante|display|xicara|soluvel|drip-coffee|cafeteira/i.test(name)) continue;

      out.set(link, { name, link, key: link });

    }

  }



  return [...out.values()];

}



async function fetch3cCompat() {

  const html = await fetch(

    'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/',

    { headers: { 'User-Agent': UA } },

  ).then((r) => r.text());



  const slugs = [...new Set([...html.matchAll(/capsulas\/compativeis\/([^/"']+)\//g)].map((m) => m[1]))];

  return slugs.map((slug) => ({ slug, key: slug, name: slug }));

}



console.log('Buscando listagens oficiais…\n');



const [nespressoSite, tresSite, compat3cSite] = await Promise.all([

  fetchNespressoOriginal(),

  fetchTresMercafe(),

  fetch3cCompat(),

]);



const nespressoLocal = loadCatalog('nespresso').filter((e) => !e.slug.startsWith('3c-'));

const compat3cLocal = loadCatalog('nespresso').filter((e) => e.slug.startsWith('3c-'));

const dgLocal = loadCatalog('dolce-gusto');

const tresLocal = loadCatalog('tres-coracoes');



const nespressoDiff = diffByKey(

  nespressoLocal,

  nespressoSite,

  (e) => norm(e.name),

  (e) => e.key,

  (e) => e.name,

  (e) => e.name,

  NESPRESSO_BR_ALIASES,

);



const dgDiff = {

  localCount: dgLocal.length,

  siteCount: DG_SITE_REF,

  onlyLocal: [],

  onlySite: [],

  note: 'Site é SPA; referência fixa de jun/2026 (seed-coffee-catalog-dg.mjs)',

};

if (dgLocal.length !== DG_SITE_REF) {

  dgDiff.onlyLocal =

    dgLocal.length > DG_SITE_REF ? [`+${dgLocal.length - DG_SITE_REF} vs referência`] : [];

  dgDiff.onlySite =

    dgLocal.length < DG_SITE_REF ? [`-${DG_SITE_REF - dgLocal.length} vs referência`] : [];

}



const tresDiff = diffByKey(

  tresLocal,

  tresSite,

  (e) => mercafeLinkFromUrl(e.catalogUrl) ?? norm(TRES_LEGACY_NAMES[norm(e.name)] ?? e.name),

  (e) => e.link,

  (e) => e.name,

  (e) => e.name,

);



// TRES: muitos SKUs existem no Mercafé mas não aparecem na busca VTEX
const tresOnlyLocalVerified = [];
for (const name of tresDiff.onlyLocal) {
  const entry = tresLocal.find((e) => e.name === name);
  if (!entry?.catalogUrl) {
    tresOnlyLocalVerified.push(name);
    continue;
  }
  if (entry.catalogUrl.includes('cafe3coracoes.com.br')) continue;
  if (/descontinuado/i.test(entry.flavorNotes ?? '')) continue;
  const r = await fetch(entry.catalogUrl, { method: 'HEAD', headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!r.ok) tresOnlyLocalVerified.push(name);
}
if (tresOnlyLocalVerified.length < tresDiff.onlyLocal.length) {
  console.log(
    `\n  (${tresDiff.onlyLocal.length - tresOnlyLocalVerified.length} TRES com PDP ativo não indexados na busca VTEX)`,
  );
}
tresDiff.onlyLocal = tresOnlyLocalVerified;



const compatDiff = diffByKey(

  compat3cLocal,

  compat3cSite,

  (e) => COMPAT_3C_SLUG[e.slug] ?? e.slug.replace(/^3c-/, ''),

  (e) => e.slug,

  (e) => e.name,

  (e) => e.slug,

);



let allOk = true;

allOk = printDiff('Nespresso Original (nespresso.com/br)', nespressoDiff) && allOk;

allOk = printDiff('Dolce Gusto (nescafe-dolcegusto.com.br/sabores)', dgDiff) && allOk;

allOk = printDiff('Três Corações (Mercafé — por link VTEX)', tresDiff, { maxList: 25 }) && allOk;

allOk = printDiff('3 Corações compatível Nespresso (cafe3coracoes.com.br)', compatDiff) && allOk;



const discontinued = tresLocal.filter((e) =>

  /descontinuado/i.test(e.flavorNotes ?? ''),

);

if (discontinued.length) {

  console.log('\n=== TRES — descontinuados no Mercafé (mantidos no app) ===');

  for (const e of discontinued) console.log(`  ~ ${e.name}`);

}



let genericUrls = 0;

let brokenMercafe = 0;

for (const entries of [nespressoLocal, compat3cLocal, dgLocal, tresLocal]) {

  for (const e of entries) {

    if (!e.catalogUrl || e.catalogUrl.endsWith('/sabores') || e.catalogUrl.endsWith('/original')) {

      genericUrls++;

    }

    if (e.catalogUrl?.includes('mercafe.com.br')) {

      const r = await fetch(e.catalogUrl, { method: 'HEAD', headers: { 'User-Agent': UA }, redirect: 'follow' });

      if (!r.ok) brokenMercafe++;

    }

  }

}

console.log(`\n=== URLs de produto ===`);

console.log(`  Entradas com URL genérica (PLP): ${genericUrls}`);

console.log(`  URLs Mercafé com HTTP erro: ${brokenMercafe}`);



console.log(allOk && brokenMercafe === 0 ? '\n✓ Resumo: catálogos batem com os sites' : '\n⚠ Resumo: há divergências — ver acima');

