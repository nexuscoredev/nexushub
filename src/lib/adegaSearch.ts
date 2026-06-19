import { supabase } from './supabase';

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
