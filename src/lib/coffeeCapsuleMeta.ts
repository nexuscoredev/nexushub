import type { CoffeeCupSize } from './viniciusCoffeeStock';

export const COFFEE_CUP_SIZES: { id: CoffeeCupSize; label: string; icon: string }[] = [
  { id: 'espresso', label: 'Espresso', icon: '☕' },
  { id: 'ristretto', label: 'Ristretto', icon: '▪' },
  { id: 'lungo', label: 'Lungo', icon: '◔' },
  { id: 'regular', label: 'Regular', icon: '◕' },
  { id: 'other', label: 'Outro', icon: '○' },
];

export function cupSizeLabel(size?: CoffeeCupSize): string | null {
  if (!size) return null;
  return COFFEE_CUP_SIZES.find((entry) => entry.id === size)?.label ?? null;
}

export function intensityLabel(intensity?: number): string | null {
  if (intensity == null) return null;
  if (intensity <= 4) return 'Suave';
  if (intensity <= 8) return 'Equilibrado';
  return 'Intenso';
}

export function formatCoffeePrice(value?: number): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function capsuleGalleryImages(item: {
  imageUrl?: string;
  extraImageUrls?: string[];
}): string[] {
  const urls = [item.imageUrl, ...(item.extraImageUrls ?? [])].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );
  return [...new Set(urls)];
}

export function parseExtraImageUrls(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function joinExtraImageUrls(urls?: string[]): string {
  return (urls ?? []).join('\n');
}
