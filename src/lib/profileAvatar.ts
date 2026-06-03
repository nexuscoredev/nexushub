import { supabase, supabaseErrorMessage } from './supabase';

export const AVATAR_BUCKET = 'hub-avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extensionForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export function avatarStoragePath(userId: string, mime: string): string {
  return `${userId}/avatar.${extensionForMime(mime)}`;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Use JPEG, PNG, WebP ou GIF.';
  }
  if (file.size > MAX_BYTES) {
    return 'A imagem deve ter no máximo 2 MB.';
  }
  return null;
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const validation = validateAvatarFile(file);
  if (validation) throw new Error(validation);

  const path = avatarStoragePath(userId, file.type);
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });

  if (uploadError) throw new Error(supabaseErrorMessage(uploadError));

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const versioned = `${data.publicUrl}?v=${Date.now()}`;
  return versioned;
}

export async function removeProfileAvatar(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data: listed, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (listError) throw new Error(supabaseErrorMessage(listError));

  const paths = (listed ?? [])
    .filter((o) => o.name?.startsWith('avatar.'))
    .map((o) => `${userId}/${o.name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) throw new Error(supabaseErrorMessage(removeError));
  }
}
