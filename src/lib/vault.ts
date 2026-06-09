import type { EncryptedPayload } from './vaultCrypto';
import { supabase, supabaseErrorMessage } from './supabase';

export type VaultCategoria = 'infra' | 'saas' | 'cliente' | 'banco' | 'email' | 'outro';

export interface HubVaultConfig {
  id: number;
  kdf_salt: string;
  verifier_iv: string;
  verifier_ciphertext: string;
  created_at: string;
  updated_at: string;
}

export interface HubVaultEntry {
  id: string;
  titulo: string;
  usuario_login: string | null;
  url: string | null;
  categoria: VaultCategoria;
  system_id: string | null;
  password_iv: string;
  password_ciphertext: string;
  notas_iv: string | null;
  notas_ciphertext: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultEntryInput {
  titulo: string;
  usuario_login?: string;
  url?: string;
  categoria: VaultCategoria;
  system_id?: string | null;
  passwordEncrypted: EncryptedPayload;
  notasEncrypted?: EncryptedPayload | null;
}

function isMissingVaultTableError(message: string): boolean {
  return /hub_vault_|schema cache|could not find|pgrst205/i.test(message);
}

export async function fetchVaultConfig(): Promise<HubVaultConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('hub_vault_config').select('*').maybeSingle();
  if (error) {
    const msg = supabaseErrorMessage(error);
    if (isMissingVaultTableError(msg)) return null;
    throw new Error(msg);
  }
  return data as HubVaultConfig | null;
}

export async function saveVaultConfig(input: {
  kdf_salt: string;
  verifier_iv: string;
  verifier_ciphertext: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('hub_vault_config').upsert({
    id: 1,
    ...input,
  });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function fetchVaultEntries(): Promise<HubVaultEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_vault_entries')
    .select('*')
    .order('titulo');
  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []) as HubVaultEntry[];
}

export async function createVaultEntry(
  userId: string,
  input: VaultEntryInput
): Promise<HubVaultEntry> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const row = {
    titulo: input.titulo.trim(),
    usuario_login: input.usuario_login?.trim() || null,
    url: input.url?.trim() || null,
    categoria: input.categoria,
    system_id: input.system_id ?? null,
    password_iv: input.passwordEncrypted.iv,
    password_ciphertext: input.passwordEncrypted.ciphertext,
    notas_iv: input.notasEncrypted?.iv ?? null,
    notas_ciphertext: input.notasEncrypted?.ciphertext ?? null,
    created_by: userId,
    updated_by: userId,
  };
  const { data, error } = await supabase.from('hub_vault_entries').insert(row).select('*').single();
  if (error) throw new Error(supabaseErrorMessage(error));
  return data as HubVaultEntry;
}

export async function updateVaultEntry(
  id: string,
  userId: string,
  input: VaultEntryInput
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('hub_vault_entries')
    .update({
      titulo: input.titulo.trim(),
      usuario_login: input.usuario_login?.trim() || null,
      url: input.url?.trim() || null,
      categoria: input.categoria,
      system_id: input.system_id ?? null,
      password_iv: input.passwordEncrypted.iv,
      password_ciphertext: input.passwordEncrypted.ciphertext,
      notas_iv: input.notasEncrypted?.iv ?? null,
      notas_ciphertext: input.notasEncrypted?.ciphertext ?? null,
      updated_by: userId,
    })
    .eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deleteVaultEntry(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('hub_vault_entries').delete().eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export const VAULT_CATEGORIAS: { value: VaultCategoria; label: string }[] = [
  { value: 'infra', label: 'Infraestrutura' },
  { value: 'saas', label: 'SaaS' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'banco', label: 'Banco' },
  { value: 'email', label: 'E-mail' },
  { value: 'outro', label: 'Outro' },
];
