export interface FinanceProviderBrand {
  id: 'cursor' | 'supabase' | 'vercel';
  src: string;
  alt: string;
  /** Compensa margem interna do PNG para peso visual uniforme no slot. */
  visualScale: number;
}

const FINANCE_PROVIDER_BRANDS: Record<'cursor' | 'supabase' | 'vercel', FinanceProviderBrand> = {
  cursor: { id: 'cursor', src: '/img/finance/brands/cursor.png', alt: 'Cursor', visualScale: 1.18 },
  supabase: { id: 'supabase', src: '/img/finance/brands/supabase.png', alt: 'Supabase', visualScale: 1.46 },
  vercel: { id: 'vercel', src: '/img/finance/brands/vercel.png', alt: 'Vercel', visualScale: 0.82 },
};

/** Wordmarks oficiais para assinaturas na fila Saída → Assinaturas. */
export function matchFinanceProviderBrand(titulo: string): FinanceProviderBrand | null {
  const n = titulo.toLowerCase().trim();
  if (n === 'cursor' || n.startsWith('cursor ')) return FINANCE_PROVIDER_BRANDS.cursor;
  if (n === 'supabase' || n.startsWith('supabase ')) return FINANCE_PROVIDER_BRANDS.supabase;
  if (n === 'vercel' || n.startsWith('vercel ')) return FINANCE_PROVIDER_BRANDS.vercel;
  return null;
}
