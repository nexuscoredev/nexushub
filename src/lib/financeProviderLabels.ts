export interface FinanceProviderBrand {
  src: string;
  alt: string;
}

const FINANCE_PROVIDER_BRANDS: Record<'cursor' | 'supabase' | 'vercel', FinanceProviderBrand> = {
  cursor: { src: '/img/finance/brands/cursor.png', alt: 'Cursor' },
  supabase: { src: '/img/finance/brands/supabase.png', alt: 'Supabase' },
  vercel: { src: '/img/finance/brands/vercel.png', alt: 'Vercel' },
};

/** Wordmarks oficiais para assinaturas na fila Saída → Assinaturas. */
export function matchFinanceProviderBrand(titulo: string): FinanceProviderBrand | null {
  const n = titulo.toLowerCase().trim();
  if (n === 'cursor' || n.startsWith('cursor ')) return FINANCE_PROVIDER_BRANDS.cursor;
  if (n === 'supabase' || n.startsWith('supabase ')) return FINANCE_PROVIDER_BRANDS.supabase;
  if (n === 'vercel' || n.startsWith('vercel ')) return FINANCE_PROVIDER_BRANDS.vercel;
  return null;
}
