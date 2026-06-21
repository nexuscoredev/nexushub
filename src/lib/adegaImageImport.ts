import { supabase } from './supabase';
import { uploadPersonalMediaBlob } from './personalMediaStorage';

export type AdegaImageSearchHit = {
  id: string;
  title: string;
  thumbUrl: string;
  imageUrl: string;
  source: 'wikimedia' | 'google';
};

type ImageSearchResponse = {
  results: AdegaImageSearchHit[];
  googleConfigured: boolean;
  attribution?: string;
};

async function authToken(): Promise<string | null> {
  const session = await supabase?.auth.getSession();
  return session?.data.session?.access_token ?? null;
}

export async function searchAdegaImagesApi(
  query: string,
  signal?: AbortSignal,
): Promise<ImageSearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { results: [], googleConfigured: false };
  }

  const token = await authToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const params = new URLSearchParams({ q });
  const res = await fetch(`/api/adega/image-search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }

  return (await res.json()) as ImageSearchResponse;
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function importAdegaImageFromRemoteUrl(
  imageUrl: string,
  userId: string,
  itemId: string,
): Promise<string> {
  const token = await authToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const res = await fetch('/api/adega/image-proxy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Não foi possível importar a imagem.');
  }

  const data = (await res.json()) as { mime: string; base64: string };
  const blob = base64ToBlob(data.base64, data.mime);
  const ext = data.mime === 'image/png' ? 'png' : data.mime === 'image/webp' ? 'webp' : 'jpg';

  if (userId && supabase) {
    return uploadPersonalMediaBlob(userId, `adega/${itemId}.${ext}`, blob, data.mime);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao processar imagem.'));
    reader.readAsDataURL(blob);
  });
}

export async function readClipboardImageFile(): Promise<File | null> {
  if (!navigator.clipboard?.read) return null;

  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((entry) => entry.startsWith('image/'));
    if (!type) continue;
    const blob = await item.getType(type);
    const ext = type.split('/')[1] ?? 'png';
    return new File([blob], `clipboard.${ext}`, { type });
  }

  return null;
}

export async function readClipboardImageUrl(): Promise<string | null> {
  if (!navigator.clipboard?.readText) return null;
  const text = (await navigator.clipboard.readText()).trim();
  if (!text.startsWith('http://') && !text.startsWith('https://')) return null;
  try {
    const url = new URL(text);
    if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url.pathname) && !url.hostname.includes('googleusercontent')) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
