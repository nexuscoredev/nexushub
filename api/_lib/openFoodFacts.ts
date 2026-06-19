const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_USER_AGENT = 'NEXUS-Hub/1.0 (Adega pessoal; https://nexussystems.dev)';

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

const NON_BEVERAGE_HINTS = ['sardine', 'sauce', 'chocolate', 'candy', 'cookie', 'biscuit', 'perfume'];

function normalizeTags(tags: string[] | undefined): string {
  return (tags ?? []).join(' ').toLowerCase();
}

function isLikelyAlcoholic(tags: string[]): boolean {
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
    blob.includes('champagne')
  );
}

function isExcludedName(name: string): boolean {
  const lower = name.toLowerCase();
  return NON_BEVERAGE_HINTS.some((hint) => lower.includes(hint));
}

export function mapOffCategory(tags: string[] | undefined): string {
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
  return 'Outro';
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

function mapProduct(product: OffProduct): AdegaSearchHit | null {
  const name = product.product_name?.trim();
  const barcode = product.code?.trim();
  const tags = product.categories_tags ?? [];
  if (!name || !barcode || !isLikelyAlcoholic(tags) || isExcludedName(name)) return null;

  const brand = product.brands?.split(',')[0]?.trim() || undefined;
  const imageUrl = product.image_front_small_url?.trim() || undefined;

  return {
    barcode,
    name,
    brand,
    category: mapOffCategory(tags),
    volumeMl: parseVolumeMl(product),
    abv: parseAbv(product),
    origin: parseOrigin(product.countries_tags),
    imageUrl,
  };
}

function rankHits(a: AdegaSearchHit, b: AdegaSearchHit): number {
  const aImg = a.imageUrl ? 1 : 0;
  const bImg = b.imageUrl ? 1 : 0;
  if (aImg !== bImg) return bImg - aImg;
  if (a.category !== 'Outro' && b.category === 'Outro') return -1;
  if (a.category === 'Outro' && b.category !== 'Outro') return 1;
  return a.name.localeCompare(b.name, 'pt-BR');
}

export async function searchOpenFoodFacts(query: string): Promise<AdegaSearchHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '16',
    fields:
      'code,product_name,brands,quantity,product_quantity,product_quantity_unit,image_front_small_url,categories_tags,alcohol_100g,countries_tags',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': OFF_USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open Food Facts respondeu ${response.status}`);
    }

    const data = (await response.json()) as { products?: OffProduct[] };
    const hits = (data.products ?? [])
      .map(mapProduct)
      .filter((hit): hit is AdegaSearchHit => hit != null)
      .sort(rankHits);

    const seen = new Set<string>();
    const unique: AdegaSearchHit[] = [];
    for (const hit of hits) {
      if (seen.has(hit.barcode)) continue;
      seen.add(hit.barcode);
      unique.push(hit);
      if (unique.length >= 8) break;
    }
    return unique;
  } finally {
    clearTimeout(timeout);
  }
}
