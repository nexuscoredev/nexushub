import { supabase, supabaseErrorMessage } from './supabase';

export const PERSONAL_MEDIA_BUCKET = 'hub-personal-media';

function extensionForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/svg+xml') return 'svg';
  return 'jpg';
}

function setupHint(err: unknown): string | null {
  const msg = supabaseErrorMessage(err).toLowerCase();
  if (/bucket not found|hub-personal-media|hub_personal|schema cache|pgrst205/i.test(msg)) {
    return 'Mídia pessoal não configurada no Supabase. Rode a migration 20260627120000_hub_personal_cloud.sql.';
  }
  return null;
}

export function personalMediaPath(userId: string, ...parts: string[]): string {
  return [userId, ...parts.filter(Boolean)].join('/');
}

export async function dataUrlToBlob(dataUrl: string): Promise<{ blob: Blob; mime: string }> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mime = blob.type || dataUrl.match(/^data:([^;]+)/)?.[1] || 'image/jpeg';
  return { blob, mime };
}

export async function uploadPersonalMediaBlob(
  userId: string,
  relativePath: string,
  blob: Blob,
  contentType: string,
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const path = personalMediaPath(userId, relativePath);
  const { error } = await supabase.storage.from(PERSONAL_MEDIA_BUCKET).upload(path, blob, {
    upsert: true,
    cacheControl: '3600',
    contentType,
  });

  if (error) {
    const hint = setupHint(error);
    throw new Error(hint ?? supabaseErrorMessage(error));
  }

  const { data } = supabase.storage.from(PERSONAL_MEDIA_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function persistRemoteImageRef(
  userId: string,
  src: string,
  relativePath: string,
): Promise<string> {
  if (!src.startsWith('data:image/')) return src;
  const { blob, mime } = await dataUrlToBlob(src);
  const ext = extensionForMime(mime);
  const path = relativePath.includes('.') ? relativePath : `${relativePath}.${ext}`;
  return uploadPersonalMediaBlob(userId, path, blob, mime);
}
