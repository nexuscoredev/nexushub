export function googleSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return 'https://www.google.com/search';
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function googleImagesSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return 'https://www.google.com/search?tbm=isch';
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}&udm=2`;
}

export function adegaItemGoogleQuery(parts: {
  name?: string;
  brand?: string;
  category?: string;
}): string {
  const category = parts.category === 'Outro' ? undefined : parts.category;
  return [parts.name, parts.brand, category, 'garrafa bebida']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function openGoogleSearch(query: string): void {
  const url = googleSearchUrl(query);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openGoogleImagesSearch(query: string): void {
  const url = googleImagesSearchUrl(query);
  window.open(url, '_blank', 'noopener,noreferrer');
}
