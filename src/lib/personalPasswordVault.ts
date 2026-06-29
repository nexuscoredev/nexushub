import type { EncryptedPayload } from './vaultCrypto';
import { supabase, supabaseErrorMessage } from './supabase';

export type PersonalVaultCategoria =
  | 'trabalho'
  | 'financas'
  | 'compras'
  | 'streaming'
  | 'redes'
  | 'email'
  | 'outro';

export interface PersonalVaultConfig {
  user_id: string;
  kdf_salt: string;
  verifier_iv: string;
  verifier_ciphertext: string;
  updated_at: string;
}

export interface PersonalVaultEntry {
  id: string;
  user_id: string;
  titulo: string;
  usuario_login: string | null;
  url: string | null;
  categoria: PersonalVaultCategoria;
  password_iv: string | null;
  password_ciphertext: string | null;
  notas_iv: string | null;
  notas_ciphertext: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalVaultEntryInput {
  titulo: string;
  usuario_login?: string;
  url?: string;
  categoria: PersonalVaultCategoria;
  passwordEncrypted?: EncryptedPayload | null;
  notasEncrypted?: EncryptedPayload | null;
}

export const PERSONAL_VAULT_CATEGORIAS: { value: PersonalVaultCategoria; label: string }[] = [
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'financas', label: 'Finanças' },
  { value: 'compras', label: 'Compras' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'redes', label: 'Redes sociais' },
  { value: 'email', label: 'E-mail' },
  { value: 'outro', label: 'Outro' },
];

function isMissingTableError(message: string): boolean {
  return /hub_personal_vault|schema cache|could not find|pgrst205/i.test(message);
}

export async function fetchPersonalVaultConfig(
  userId: string,
): Promise<PersonalVaultConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('hub_personal_vault_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    const msg = supabaseErrorMessage(error);
    if (isMissingTableError(msg)) return null;
    throw new Error(msg);
  }
  return data as PersonalVaultConfig | null;
}

export async function savePersonalVaultConfig(
  userId: string,
  input: Pick<PersonalVaultConfig, 'kdf_salt' | 'verifier_iv' | 'verifier_ciphertext'>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('hub_personal_vault_config').upsert({
    user_id: userId,
    ...input,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function fetchPersonalVaultEntries(userId: string): Promise<PersonalVaultEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_personal_vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('titulo');
  if (error) {
    const msg = supabaseErrorMessage(error);
    if (isMissingTableError(msg)) return [];
    throw new Error(msg);
  }
  return (data ?? []) as PersonalVaultEntry[];
}

export async function createPersonalVaultEntry(
  userId: string,
  input: PersonalVaultEntryInput,
): Promise<PersonalVaultEntry> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    titulo: input.titulo.trim(),
    usuario_login: input.usuario_login?.trim() || null,
    url: input.url?.trim() || null,
    categoria: input.categoria,
    password_iv: input.passwordEncrypted?.iv ?? null,
    password_ciphertext: input.passwordEncrypted?.ciphertext ?? null,
    notas_iv: input.notasEncrypted?.iv ?? null,
    notas_ciphertext: input.notasEncrypted?.ciphertext ?? null,
    updated_at: now,
  };
  const { data, error } = await supabase
    .from('hub_personal_vault_entries')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(supabaseErrorMessage(error));
  return data as PersonalVaultEntry;
}

export async function updatePersonalVaultEntry(
  id: string,
  userId: string,
  input: PersonalVaultEntryInput,
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('hub_personal_vault_entries')
    .update({
      titulo: input.titulo.trim(),
      usuario_login: input.usuario_login?.trim() || null,
      url: input.url?.trim() || null,
      categoria: input.categoria,
      password_iv: input.passwordEncrypted?.iv ?? null,
      password_ciphertext: input.passwordEncrypted?.ciphertext ?? null,
      notas_iv: input.notasEncrypted?.iv ?? null,
      notas_ciphertext: input.notasEncrypted?.ciphertext ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deletePersonalVaultEntry(id: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('hub_personal_vault_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(supabaseErrorMessage(error));
}
