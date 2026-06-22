import { supabase } from './supabase';
import { ADEGA_CATEGORY_PRESETS } from './viniciusAdega';

export type AdegaSearchResult = {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  volumeMl?: number;
  abv?: number;
  origin?: string;
  imageUrl?: string;
};

type AdegaSearchResponse = {
  results: AdegaSearchResult[];
  attribution?: string;
};

async function authToken(): Promise<string | null> {
  const session = await supabase?.auth.getSession();
  return session?.data.session?.access_token ?? null;
}

export async function searchAdegaProducts(query: string, signal?: AbortSignal): Promise<AdegaSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const token = await authToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const params = new URLSearchParams({ q });
  const res = await fetch(`/api/adega/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }

  const data = (await res.json()) as AdegaSearchResponse;
  return data.results ?? [];
}

export function adegaProductSearchQuery(parts: { name?: string; brand?: string }): string {
  return [parts.brand, parts.name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export type AdegaSearchFormPatch = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  volumeMl: string;
  abv: string;
  origin: string;
  imageUrl: string;
  barcode: string;
};

export function mapAdegaSearchResultToForm(result: AdegaSearchResult): AdegaSearchFormPatch {
  const preset = ADEGA_CATEGORY_PRESETS.includes(result.category as (typeof ADEGA_CATEGORY_PRESETS)[number]);
  return {
    name: result.name,
    category: preset ? result.category : 'Outro',
    customCategory: preset ? '' : result.category,
    brand: result.brand ?? '',
    volumeMl: result.volumeMl != null ? String(result.volumeMl) : '',
    abv: result.abv != null ? String(result.abv) : '',
    origin: result.origin ?? '',
    imageUrl: result.imageUrl ?? '',
    barcode: result.barcode,
  };
}
