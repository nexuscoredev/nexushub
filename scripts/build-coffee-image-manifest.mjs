/**
 * Gera coffee-image-manifest.json a partir dos catálogos + mapas extraídos do site oficial.
 * node scripts/build-coffee-image-manifest.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = join(__dirname, '../src/data/coffeeCapsuleCatalog');

function stripMagentoCache(url) {
  if (!url) return url;
  return url.replace(/\/cache\/[a-f0-9]{20,}\//i, '/');
}

function cleanDolceGustoBoxUrl(url) {
  if (!url) return url;
  const base = stripMagentoCache(url);
  return base
    .replace(/mobile[-_]?hero/gi, 'xicara-reta')
    .replace(/10_capsulas_mobile_hero/gi, '10_capsulas_xicara_reta')
    .replace(/xicara-reta-reta/gi, 'xicara-reta');
}

function dolceGustoCapsuleUrlFromBox(boxUrl) {
  if (!boxUrl) return null;
  const base = stripMagentoCache(boxUrl);
  const capsule = base
    .replace(/xicara[-_]reta/gi, 'capsula')
    .replace(/mobile[-_]?hero/gi, 'capsula')
    .replace(/10_capsulas_xicara_reta/gi, '10_capsulas_capsula');
  return capsule !== base ? capsule : null;
}

/** Extraído de nescafe-dolcegusto.com.br/sabores (jun/2026). */
const DG_BOX_BY_NAME = {
  'MOÇA PISTACCHIO LATTE':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_1__2.png',
  'STARBUCKS Espresso Colombia':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240517_mockups_de_ndg_novo_modelo_colombia.png',
  ESPRESSO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/s/espresso_mobile-hero.png',
  'ESPRESSO DESCAFEINADO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20250314_mockup_decaff_descafeinado_nacionalizado_8_copiar_1_.png',
  'ESPRESSO INTENSO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/s/espresso_intenso_mobile-hero.png',
  'DOPPIO ESPRESSO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_7.png',
  'ESPRESSO BARISTA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_5_1.png',
  'CAFFÈ MATINAL':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/f/r/frente_6.png',
  LUNGO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_4.png',
  'CAFÉ CASEIRO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_3_1.png',
  'CAFÉ CASEIRO INTENSO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_5.png',
  'KOPENHAGEN ESPRESSO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_7_1.png',
  'LUNGO CHAPADA DIAMANTINA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_4_1.png',
  'ESPRESSO NESCAFÉ GOLD':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/g/o/gold_6_mobile_hero.png',
  'LUNGO NESCAFÉ GOLD':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/g/o/gold_8_xicara_reta.png',
  'ESPRESSO CERRADO MINEIRO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/n/enxoval-site--maktplace-cerrado.png',
  'ORIGENS DO MUNDO BRASIL ORGÂNICO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240528_mockups_sabores_produtos_regulares_ndg_origens-do-mundo-brasil-organico---10-capsulas.png',
  'ESPRESSO SERRAS DO ALTO PARANAÍBA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_serras.png',
  'STARBUCKS Espresso Roast':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240517_mockups_de_ndg_novo_modelo_roast.png',
  'STARBUCKS Americano House Blend':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240517_mockups_de_ndg_novo_modelo_house.png',
  SHAKERATO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_7_.png',
  'MOCHACCINO CANELA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mochaccino_canela_mobile-hero.png',
  CAPPUCCINO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/c/a/cappuccino_mobile-hero.png',
  'CAFÉ AU LAIT':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/a/u/au_laitfrente.png',
  'CAFÉ AU LAIT DESNATADO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/a/u/au-lait-desnatado-mobile-hero.png',
  'CAFÉ AU LAIT VANILLA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_2_.png',
  CORTADO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_3_.png',
  PINGADO:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/p/i/pingado_mobile-hero.png',
  'MOCHACCINO AVELÃ':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/x/_/x_cara-capsula.png',
  'LATTE MACCHIATO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_1_.png',
  'VANILLA LATTE MACCHIATO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_6_.png',
  FRAPPE:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_4_.png',
  'CAPPUCCINO MOÇA DOCE DE LEITE':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/n/enxoval-site--maktplace_mo_a_1_.png',
  'KOPENHAGEN CAPPUCCINO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_7.png',
  'KOPENHAGEN  LAJOTINHA':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_6_1.png',
  'STARBUCKS Cappuccino':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240517_mockups_de_ndg_novo_modelo_cappuccino.png',
  'STARBUCKS Caramel Macchiato':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/2/0/20240517_mockups_de_ndg_novo_modelo_caramel.png',
  'KOPENHAGEN  LÍNGUA DE GATO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero-02_1.png',
  GALAK:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/n/enxoval-site--maktplace-galak.png',
  NESCAU:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_8_.png',
  'CHOCOCINO NESTLÉ':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_2__2.png',
  NESQUIK:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/e/n/enxoval-site--maktplace-nesquiick.png',
  'CHAI TEA LATTE':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/x/i/xicara-e-capsula-mocha.png',
  "NATURE'S HEART HIBISCUS PINK LEMONADE":
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_pink_lemonade.png',
  'NESTEA PÊSSEGO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/n/e/nestea_pessego_10_capsulas_xicara_reta.png',
  "NATURE'S HEART ZEN STYLE":
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_zen_style.png',
  'NEO Espresso Delicate':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/n/e/neostart_espresso_delicate-images_1000x1000px_5.png',
  'NEO Espresso Serras do Alto Paranaíba':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/n/e/neostart_espresso_altoparanaiba_hero-images_1000x1000px_5_1.png',
  'NEO Lungo Chapada Diamantina':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/n/e/neostart_lungo_chapadadiamantina_hero-images_1000x1000px_5_1__1.png',
  'CARAMELO SALGADO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_1_4.png',
  'CHOCOCINO ALPINO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/a/l/alpino_xicara_reta.png',
  KITKAT:
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile_hero_3.png',
  'NESTEA MATE LIMÃO':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/m/o/mobile-hero_5_.png',
  'NEO Espresso Sul de Minas Orgânico':
    'https://www.nescafe-dolcegusto.com.br/media/catalog/product/cache/a7ed62b12c9d28aa0842b5a9bc7623a5/n/e/neostart_espresso_suldeminashero-images_1000x1000px_5.png',
};

const NESPRESSO_BOX_LEGACY = {
  Ristretto:
    'https://www.nespresso.com/ecom/medias/sys_master/public/16467720470558/ispirazione-ristretto-italiano-XL.png',
  Arpeggio:
    'https://www.nespresso.com/ecom/medias/sys_master/public/16653366034462/arpeggio-2x.png',
  Roma: 'https://www.nespresso.com/ecom/medias/sys_master/public/16653932462110/ispirazione-roma-2x.png',
  Livanto: 'https://www.nespresso.com/ecom/medias/sys_master/public/16653944487966/livanto-2x.png',
  Capriccio:
    'https://www.nespresso.com/shared_res/agility/commons/img/coffees/OL/composition/ol_coffee-sleeves_capriccio_16-9_2x.png',
  Cosi: 'https://www.nespresso.com/shared_res/agility/commons/img/coffees/OL/composition/ol_coffee-sleeves_cosi_16-9_2x.png',
  Volluto: 'https://www.nespresso.com/static/us/solutions/product/pdp/ol_coffee-sleeves_volluto_1200x672.png',
  Napoli: 'https://www.nespresso.com/ecom/medias/sys_master/public/16653931806750/ispirazione-napoli-2x.png',
  Kazaar: 'https://www.nespresso.com/ecom/medias/sys_master/public/16653942259742/kazaar-2x.png',
  'Fortissio Lungo':
    'https://www.nespresso.com/static/us/solutions/product/pdp/stockholm-fortissio-lungo/stockholm-fortissio-lungo_XL-02.png',
  'Vivalto Lungo':
    'https://www.nespresso.com/shared_res/agility/n-components/pdp/sku-main-info/coffee-sleeves/ol/tokyo-vivalto-lungo_XL.png',
  'Linizio Lungo':
    'https://www.nespresso.com/ecom/medias/sys_master/public/28536773083166/Nes-OL-Big-Pack-36Caps-PACKSHOT-Linizio-Lungo-x3-VV-D1-2000x2000px.png',
};

const imageMapPath = join(__dirname, '_catalog-image-map.json');
const scrapedMap = existsSync(imageMapPath)
  ? JSON.parse(readFileSync(imageMapPath, 'utf8'))
  : { nespresso: {}, tres3c: {}, tresExtra: {} };

const NESPRESSO_BOX = {
  ...NESPRESSO_BOX_LEGACY,
  ...scrapedMap.nespresso,
  ...scrapedMap.tres3c,
};

function norm(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/®/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function lookup(map, entry) {
  const keys = [
    `${entry.brand ?? ''} ${entry.name}`.trim(),
    entry.name,
    entry.name.toUpperCase(),
  ];
  for (const key of keys) {
    if (!key) continue;
    if (map[key]) return map[key];
    const n = norm(key);
    for (const [k, v] of Object.entries(map)) {
      if (norm(k) === n) return v;
    }
  }
  return null;
}

function resolveImageHit(map, entry) {
  const hit = lookup(map, entry);
  if (!hit) return null;
  if (typeof hit === 'string') return { box: hit, capsule: null };
  return hit;
}

function buildSystem(system, map, catalogUrl, options = {}) {
  const entries = JSON.parse(readFileSync(join(CATALOG_DIR, `${system}.json`), 'utf8'));
  return entries.map((entry) => {
    const hit = resolveImageHit(map, entry);
    let box = hit?.box ?? null;
    let capsule = hit?.capsule ?? null;
    if (options.cleanDolceGusto && box) {
      const raw = stripMagentoCache(box);
      const cleaned = cleanDolceGustoBoxUrl(raw);
      capsule = capsule ?? dolceGustoCapsuleUrlFromBox(raw) ?? dolceGustoCapsuleUrlFromBox(cleaned);
      return {
        slug: entry.slug,
        name: entry.name,
        rawBox: raw,
        box: cleaned,
        capsule: capsule ? stripMagentoCache(capsule) : null,
        catalogUrl: hit?.catalogUrl ?? catalogUrl,
      };
    }
    return {
      slug: entry.slug,
      name: entry.name,
      box,
      capsule,
      catalogUrl: hit?.catalogUrl ?? catalogUrl,
    };
  });
}

/** Mercafé / café3coracoes — jun/2026. */
const TRES_IMAGES_BY_NAME = {
  'Espresso Forza': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553882/FORZA.png?v=638836110347800000',
    capsule:
      'https://mercafefaststore.vtexassets.com/arquivos/ids/553884/CAPSULA-FORZA--1-.png?v=638836110348570000',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cafe-espresso-forza/',
  },
  'Espresso Ristretto': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553672/Espresso-Gourmet-Dark-Roast.png?v=638836119744000000',
    capsule:
      'https://mercafefaststore.vtexassets.com/arquivos/ids/549883/Capsula-de-Espresso-Gourmet-Dark-Roast-TRES-3C.png?v=638158916136200000',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-gourmet-dark-roast-tres/p',
  },
  'Espresso Clássico': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553112/PLENO.png?v=638751595686300000',
    capsule:
      'https://mercafefaststore.vtexassets.com/arquivos/ids/553828/CAPSULA-PLENO.png?v=638751595686600000',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-pleno-tres/p',
  },
  'Espresso Suave': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/552787/SUPREMO.png?v=638836109783300000',
    capsule:
      'https://mercafefaststore.vtexassets.com/arquivos/ids/553824/CAPSULA-SUPREMO.png?v=638836109783600000',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-supremo-tres/p',
  },
  'Lungo Intenso': {
    box: 'https://mercafefaststore.vtexassets.com/arquivos/ids/553888/VIBRANTE.png?v=638755959103930000',
    capsule:
      'https://mercafefaststore.vtexassets.com/arquivos/ids/553891/CAPSULA-VIBRANTE.png?v=638755959104100000',
    catalogUrl: 'https://www.mercafe.com.br/capsula-cafe-espresso-vibrante-tres/p',
  },
  'Cappuccino Clássico': {
    box: 'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cappuccino-3-coracoes.png',
    capsule:
      'https://www.cafe3coracoes.com.br/wp-content/uploads/2024/09/capsula-tres-cappuccino-3-coracoes-02.png',
    catalogUrl: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cappuccino-classic/',
  },
  ...(scrapedMap.tresExtra ?? {}),
};

function buildTresCoracoes() {
  const entries = JSON.parse(
    readFileSync(join(CATALOG_DIR, 'tres-coracoes.json'), 'utf8'),
  );
  return entries.map((entry) => {
    const hit = resolveImageHit(TRES_IMAGES_BY_NAME, entry);
    return {
      slug: entry.slug,
      name: entry.name,
      box: hit?.box ?? null,
      capsule: hit?.capsule ?? null,
      catalogUrl: hit?.catalogUrl ?? 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/',
    };
  });
}

const manifest = {
  'dolce-gusto': buildSystem(
    'dolce-gusto',
    DG_BOX_BY_NAME,
    'https://www.nescafe-dolcegusto.com.br/sabores',
    { cleanDolceGusto: true },
  ),
  nespresso: buildSystem(
    'nespresso',
    NESPRESSO_BOX,
    'https://www.nespresso.com/br/pt/order/capsules/original',
  ),
  'tres-coracoes': buildTresCoracoes(),
};

writeFileSync(join(__dirname, 'coffee-image-manifest.json'), JSON.stringify(manifest, null, 2));
const missing = manifest['dolce-gusto'].filter((x) => !x.box).map((x) => x.name);
const missingNes = manifest.nespresso.filter((x) => !x.box).map((x) => x.name);
const missingTres = manifest['tres-coracoes'].filter((x) => !x.box).map((x) => x.name);
console.log('DG missing:', missing.length, missing);
console.log('Nespresso missing:', missingNes.length, missingNes);
console.log('Três Corações missing:', missingTres.length, missingTres);
