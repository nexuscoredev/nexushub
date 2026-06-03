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

/** Windows / mobile às vezes enviam file.type vazio — inferir pela extensão. */
export function resolveAvatarMime(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return null;
}

export function avatarStoragePath(userId: string, mime: string): string {
  return `${userId}/avatar.${extensionForMime(mime)}`;
}

export function validateAvatarFile(file: File): string | null {
  const mime = resolveAvatarMime(file);
  if (!mime) {
    return 'Use JPEG, PNG, WebP ou GIF.';
  }
  if (file.size > MAX_BYTES) {
    return 'A imagem deve ter no máximo 2 MB.';
  }
  return null;
}

function avatarSetupHint(err: unknown): string | null {
  const msg = supabaseErrorMessage(err).toLowerCase();
  if (
    /bucket not found|hub-avatars|hub_pode_gerenciar|could not find|schema cache|pgrst205|avatar_url/i.test(
      msg,
    )
  ) {
    return 'Foto de perfil não configurada no Supabase. Rode o script supabase/scripts/hub_profile_avatar_fix.sql no SQL Editor.';
  }
  return null;
}

function fileForUpload(file: File, mime: string): File {
  if (file.type === mime) return file;
  return new File([file], file.name || `avatar.${extensionForMime(mime)}`, { type: mime });
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const validation = validateAvatarFile(file);
  if (validation) throw new Error(validation);

  const mime = resolveAvatarMime(file)!;
  const path = avatarStoragePath(userId, mime);
  const payload = fileForUpload(file, mime);

  try {
    await removeProfileAvatar(userId);
  } catch {
    /* pasta ainda não existe */
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, payload, { upsert: true, cacheControl: '3600', contentType: mime });

  if (uploadError) {
    const hint = avatarSetupHint(uploadError);
    throw new Error(hint ?? supabaseErrorMessage(uploadError));
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeProfileAvatar(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data: listed, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (listError) {
    const msg = supabaseErrorMessage(listError);
    if (/bucket not found/i.test(msg)) return;
    const hint = avatarSetupHint(listError);
    throw new Error(hint ?? msg);
  }

  const paths = (listed ?? [])
    .filter((o) => o.name?.startsWith('avatar.'))
    .map((o) => `${userId}/${o.name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) throw new Error(supabaseErrorMessage(removeError));
  }
}
