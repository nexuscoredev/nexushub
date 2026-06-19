const OFF_HOSTS = ['world.openfoodfacts.org', 'br.openfoodfacts.org'] as const;
const OFF_USER_AGENT = 'NEXUS-Hub/1.0 (Adega pessoal; https://nexussystems.dev)';
const PAGE_SIZE = 32;
const MAX_RESULTS = 12;
const BR_FALLBACK_MIN = 6;

export type AdegaSearchHit = {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  volumeMl?: number;
  abv?: number;
  origin?: string;
  imageUrl?: string;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  product_quantity?: number;
  product_quantity_unit?: string;
  image_front_small_url?: string;
  categories_tags?: string[];
  alcohol_100g?: number;
  countries_tags?: string[];
};

const COUNTRY_LABELS: Record<string, string> = {
  'en:brazil': 'Brasil',
  'en:france': 'França',
  'en:scotland': 'Escócia',
  'en:united-kingdom': 'Reino Unido',
  'en:ireland': 'Irlanda',
  'en:italy': 'Itália',
  'en:spain': 'Espanha',
  'en:portugal': 'Portugal',
  'en:argentina': 'Argentina',
  'en:chile': 'Chile',
  'en:united-states': 'Estados Unidos',
  'en:mexico': 'México',
  'en:japan': 'Japão',
  'en:germany': 'Alemanha',
};

const NON_BEVERAGE_HINTS = [
  'sardine',
  'sauce',
  'chocolate',
  'candy',
  'cookie',
  'biscuit',
  'perfume',
  'couscous',
  'shampoo',
  'detergent',
];

const CATEGORY_FROM_TEXT: [RegExp, string][] = [
  [
    /whisky|whiskey|scotch|bourbon|\brye\b|single malt|blended malt|royal salute|johnnie walker|macallan|chivas|glenfiddich|glenlivet|jameson|jack daniel|ballantine|grant'?s|famous grouse|dewar|hibiki|yamazaki|nikka|lagavulin|laphroaig|ardbeg|talisker|bowmore/i,
    'Whisky',
  ],
  [/champagne|prosecco|espumante|cava|crémant|cremant|sparkling wine|veuve clicquot|moët|moet|dom pérignon/i, 'Vinho espumante'],
  [
    /\bvinho\b|\bwine\b|tinto|branco|rosé|rose wine|merlot|cabernet|malbec|pinot|shiraz|rioja|chianti|sauvignon|chardonnay|porto\b|port wine/i,
    'Vinho',
  ],
  [/cerveja|beer|lager|ipa|stout|pilsen|chopp|\bale\b|heineken|brahma|skol|corona|stella|budweiser|guinness|pale ale/i, 'Cerveja'],
  [/vodka|smirnoff|absolut|grey goose|ciroc|skyy/i, 'Vodka'],
  [/gin\b|tanqueray|beefeater|bombay|hendrick|seagram/i, 'Gin'],
  [/rum\b|bacardi|havana club|captain morgan/i, 'Rum'],
  [/tequila|patrón|patron|jose cuervo|olmeca/i, 'Tequila'],
  [/cachaça|cachaca|51\b|ypioca|leblon|sagatiba|pitu\b|velho barreiro/i, 'Cachaça'],
  [/licor|liqueur|amarula|baileys|kahlua|jägermeister|jager|campari|aperol|fernet/i, 'Licor'],
  [/conhaque|cognac|brandy|hennessy|martell|remy martin/i, 'Conhaque'],
];

const OFF_FIELDS =
  'code,product_name,brands,quantity,product_quantity,product_quantity_unit,image_front_small_url,categories_tags,alcohol_100g,countries_tags';

function normalizeTags(tags: string[] | undefined): string {
  return (tags ?? []).join(' ').toLowerCase();
}

function isLikelyAlcoholicTags(tags: string[]): boolean {
  const blob = normalizeTags(tags);
  return (
    blob.includes('alcoholic-beverages') ||
    blob.includes('whisky') ||
    blob.includes('whiskey') ||
    blob.includes('wine') ||
    blob.includes('beer') ||
    blob.includes('vodka') ||
    blob.includes('gin') ||
    blob.includes('rum') ||
    blob.includes('tequila') ||
    blob.includes('cachaca') ||
    blob.includes('cider') ||
    blob.includes('liqueur') ||
    blob.includes('distilled') ||
    blob.includes('hard-liquors') ||
    blob.includes('sparkling') ||
    blob.includes('champagne') ||
    blob.includes('spirits') ||
    blob.includes('beers') ||
    blob.includes('wines')
  );
}

export function inferCategoryFromText(text: string): string {
  for (const [pattern, category] of CATEGORY_FROM_TEXT) {
    if (pattern.test(text)) return category;
  }
  return 'Outro';
}

export function mapOffCategory(tags: string[] | undefined, textFallback = ''): string {
  const blob = normalizeTags(tags);
  if (blob.includes('whisky') || blob.includes('whiskey')) return 'Whisky';
  if (blob.includes('sparkling') || blob.includes('champagne') || blob.includes('prosecco')) {
    return 'Vinho espumante';
  }
  if (blob.includes('wine') || blob.includes('vin')) return 'Vinho';
  if (blob.includes('beer') || blob.includes('cerveja') || blob.includes('cider')) return 'Cerveja';
  if (blob.includes('gin')) return 'Gin';
  if (blob.includes('vodka')) return 'Vodka';
  if (blob.includes('rum')) return 'Rum';
  if (blob.includes('tequila')) return 'Tequila';
  if (blob.includes('cachaca') || blob.includes('cachaça')) return 'Cachaça';
  if (blob.includes('liqueur') || blob.includes('licor')) return 'Licor';
  if (blob.includes('brandy') || blob.includes('cognac') || blob.includes('conhaque')) return 'Conhaque';

  if (textFallback.trim()) {
    const inferred = inferCategoryFromText(textFallback);
    if (inferred !== 'Outro') return inferred;
  }
  return 'Outro';
}

function isExcludedName(name: string): boolean {
  const lower = name.toLowerCase();
  return NON_BEVERAGE_HINTS.some((hint) => lower.includes(hint));
}

function isFoodLikeProduct(product: OffProduct): boolean {
  const quantity = (product.quantity ?? '').toLowerCase();
  if (/\d+\s*g\b/.test(quantity) && !/(ml|cl|\bl\b)/.test(quantity)) return true;
  const unit = (product.product_quantity_unit ?? '').toLowerCase();
  if (unit === 'g' && product.product_quantity != null && product.product_quantity > 0) return true;
  return false;
}

function queryMatchesProduct(text: string, query: string): boolean {
  const blob = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (q.length >= 3 && blob.includes(q)) return true;
  const tokens = q.split(/\s+/).filter((token) => token.length >= 3);
  if (tokens.length === 0) return false;
  return tokens.every((token) => blob.includes(token));
}

function isLikelyAlcoholicProduct(product: OffProduct, query: string): boolean {
  const tags = product.categories_tags ?? [];
  if (isLikelyAlcoholicTags(tags)) return true;

  const name = product.product_name ?? '';
  const brand = product.brands ?? '';
  const text = `${name} ${brand}`;

  if (inferCategoryFromText(text) !== 'Outro') return true;
  if (product.alcohol_100g != null && product.alcohol_100g > 0 && product.alcohol_100g <= 100) {
    return true;
  }

  return queryMatchesProduct(text, query);
}

function parseBrand(raw: string | undefined): string | undefined {
  const brand = raw?.split(',')[0]?.trim();
  if (!brand || brand.length < 2) return undefined;
  if (!/[a-zA-ZÀ-ÿ0-9]/.test(brand)) return undefined;
  return brand;
}

function parseVolumeMl(product: OffProduct): number | undefined {
  const fromFields = parseQuantityString(
    product.product_quantity != null
      ? `${product.product_quantity}${product.product_quantity_unit ?? ''}`
      : undefined,
  );
  if (fromFields) return fromFields;
  return parseQuantityString(product.quantity);
}

function parseQuantityString(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const normalized = raw.replace(',', '.').toLowerCase();
  const mlMatch = normalized.match(/([\d.]+)\s*ml/);
  if (mlMatch) {
    const value = Number(mlMatch[1]);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
  }
  const clMatch = normalized.match(/([\d.]+)\s*cl/);
  if (clMatch) {
    const value = Number(clMatch[1]);
    return Number.isFinite(value) && value > 0 ? Math.round(value * 10) : undefined;
  }
  const lMatch = normalized.match(/([\d.]+)\s*l(?:\b|$)/);
  if (lMatch) {
    const value = Number(lMatch[1]);
    return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) : undefined;
  }
  return undefined;
}

function parseAbv(product: OffProduct): number | undefined {
  const value = product.alcohol_100g;
  if (value == null || !Number.isFinite(value) || value <= 0 || value > 100) return undefined;
  return Math.round(value * 10) / 10;
}

function parseOrigin(tags: string[] | undefined): string | undefined {
  for (const tag of tags ?? []) {
    const label = COUNTRY_LABELS[tag];
    if (label) return label;
  }
  return undefined;
}

function mapProduct(product: OffProduct, query: string): AdegaSearchHit | null {
  const name = product.product_name?.trim();
  const barcode = product.code?.trim();
  if (!name || !barcode || isExcludedName(name) || isFoodLikeProduct(product)) return null;
  if (!isLikelyAlcoholicProduct(product, query)) return null;

  const brand = parseBrand(product.brands);
  const imageUrl = product.image_front_small_url?.trim() || undefined;
  const labelText = `${name} ${brand ?? ''}`;

  return {
    barcode,
    name,
    brand,
    category: mapOffCategory(product.categories_tags, labelText),
    volumeMl: parseVolumeMl(product),
    abv: parseAbv(product),
    origin: parseOrigin(product.countries_tags),
    imageUrl,
  };
}

function queryRelevance(hit: AdegaSearchHit, query: string): number {
  const q = query.toLowerCase().trim();
  const blob = `${hit.name} ${hit.brand ?? ''}`.toLowerCase();
  let score = 0;

  if (blob.includes(q)) score += 120;
  for (const token of q.split(/\s+/).filter((part) => part.length >= 2)) {
    if (blob.includes(token)) score += 24;
  }
  if (hit.imageUrl) score += 8;
  if (hit.category !== 'Outro') score += 6;
  if (hit.volumeMl) score += 2;
  if (hit.abv) score += 2;
  return score;
}

function rankHits(a: AdegaSearchHit, b: AdegaSearchHit, query: string): number {
  const rel = queryRelevance(b, query) - queryRelevance(a, query);
  if (rel !== 0) return rel;
  const aImg = a.imageUrl ? 1 : 0;
  const bImg = b.imageUrl ? 1 : 0;
  if (aImg !== bImg) return bImg - aImg;
  if (a.category !== 'Outro' && b.category === 'Outro') return -1;
  if (a.category === 'Outro' && b.category !== 'Outro') return 1;
  return a.name.localeCompare(b.name, 'pt-BR');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOffProducts(host: string, query: string, signal: AbortSignal): Promise<OffProduct[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(PAGE_SIZE),
    sort_by: 'unique_scans_n',
    fields: OFF_FIELDS,
  });

  const response = await fetch(`https://${host}/cgi/search.pl?${params.toString()}`, {
    headers: {
      'User-Agent': OFF_USER_AGENT,
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts respondeu ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    throw new Error('Catálogo temporariamente indisponível. Tente em instantes.');
  }

  const data = (await response.json()) as { products?: OffProduct[] };
  return data.products ?? [];
}

function dedupeHits(hits: AdegaSearchHit[], query: string): AdegaSearchHit[] {
  const seen = new Set<string>();
  const unique: AdegaSearchHit[] = [];
  const sorted = [...hits].sort((a, b) => rankHits(a, b, query));

  for (const hit of sorted) {
    if (seen.has(hit.barcode)) continue;
    seen.add(hit.barcode);
    unique.push(hit);
    if (unique.length >= MAX_RESULTS) break;
  }
  return unique;
}

function mapProducts(products: OffProduct[], query: string): AdegaSearchHit[] {
  return products
    .map((product) => mapProduct(product, query))
    .filter((hit): hit is AdegaSearchHit => hit != null);
}

export async function searchOpenFoodFacts(query: string): Promise<AdegaSearchHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    let products = await fetchOffProducts(OFF_HOSTS[0], q, controller.signal);
    let hits = mapProducts(products, q);

    if (hits.length < BR_FALLBACK_MIN) {
      await sleep(350);
      const brProducts = await fetchOffProducts(OFF_HOSTS[1], q, controller.signal);
      hits = [...hits, ...mapProducts(brProducts, q)];
    }

    return dedupeHits(hits, q);
  } finally {
    clearTimeout(timeout);
  }
}
