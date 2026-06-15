import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface HubAuthUser {
  id: string;
  email?: string;
  nome: string;
  cargo: string;
  supabase: SupabaseClient;
}

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
}

function supabaseAnonKey(): string | undefined {
  return process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
}

export async function verifyHubUser(
  authHeader: string | undefined,
): Promise<HubAuthUser | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!token || !url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('hub_profiles')
    .select('nome, cargo, ativo')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.ativo || !profile.cargo) return null;

  return {
    id: user.id,
    email: user.email,
    nome: profile.nome,
    cargo: profile.cargo,
    supabase,
  };
}
