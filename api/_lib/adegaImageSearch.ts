export type ImageSearchHit = {
  id: string;
  title: string;
  thumbUrl: string;
  imageUrl: string;
  source: 'wikimedia' | 'google';
};

export async function searchWikimediaImages(
  query: string,
  limit = 8,
): Promise<ImageSearchHit[]> {
  const searchTerm = `${query.trim()} bottle`.trim();
  if (searchTerm.length < 3) return [];

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', searchTerm);
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', String(limit));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|mime');
  url.searchParams.set('iiurlwidth', '320');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NEXUSHub/1.0 (personal adega image search)' },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid?: number;
          title?: string;
          imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string }>;
        }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  const hits: ImageSearchHit[] = [];

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    const imageUrl = info?.url;
    if (!imageUrl || !info.mime?.startsWith('image/')) continue;
    hits.push({
      id: `wiki-${page.pageid ?? imageUrl}`,
      title: (page.title ?? 'Imagem').replace(/^File:/i, ''),
      thumbUrl: info.thumburl ?? imageUrl,
      imageUrl,
      source: 'wikimedia',
    });
  }

  return hits;
}

export async function searchGoogleCseImages(
  query: string,
  limit = 8,
): Promise<ImageSearchHit[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cx) return [];

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', `${query.trim()} garrafa bebida`);
  url.searchParams.set('searchType', 'image');
  url.searchParams.set('num', String(Math.min(limit, 10)));
  url.searchParams.set('safe', 'active');
  url.searchParams.set('imgSize', 'medium');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      title?: string;
      link?: string;
      image?: { thumbnailLink?: string };
    }>;
  };

  return (data.items ?? [])
    .filter((item) => item.link?.startsWith('http'))
    .map((item, index) => ({
      id: `google-${index}-${item.link}`,
      title: item.title ?? 'Imagem',
      thumbUrl: item.image?.thumbnailLink ?? item.link!,
      imageUrl: item.link!,
      source: 'google' as const,
    }));
}

export async function searchAdegaImages(query: string, limit = 8): Promise<ImageSearchHit[]> {
  const [wikimedia, google] = await Promise.all([
    searchWikimediaImages(query, limit),
    searchGoogleCseImages(query, limit),
  ]);

  const seen = new Set<string>();
  const merged: ImageSearchHit[] = [];

  for (const hit of [...google, ...wikimedia]) {
    if (seen.has(hit.imageUrl)) continue;
    seen.add(hit.imageUrl);
    merged.push(hit);
    if (merged.length >= limit) break;
  }

  return merged;
}
