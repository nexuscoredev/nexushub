import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { fetchClienteConta } from '../lib/clientePortal';
import { normalizeUsuario } from '../lib/usuarios';
import { podeGerenciar } from '../lib/cargos';
import { podeAcessarFinanceiroAgenda, normalizeEmail } from '../lib/acesso';
import { supabase, supabaseConfigured, supabaseErrorMessage } from '../lib/supabase';
import type { HubClienteConta } from '../types/clientePortal';
import type { HubProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: HubProfile | null;
  clienteConta: HubClienteConta | null;
  isEquipe: boolean;
  isCliente: boolean;
  loading: boolean;
  configured: boolean;
  podeFinanceiroAgenda: boolean;
  podeGestao: boolean;
  signIn: (usuario: string, password: string) => Promise<void>;
  signInCliente: (usuario: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshClienteConta: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<HubProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('hub_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as HubProfile | null;
}

function contaClienteAtiva(conta: HubClienteConta | null): boolean {
  if (!conta?.ativo) return false;
  const cliente = conta.cliente;
  if (cliente && typeof cliente === 'object' && 'ativo' in cliente) {
    return Boolean((cliente as { ativo?: boolean }).ativo);
  }
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HubProfile | null>(null);
  const [clienteConta, setClienteConta] = useState<HubClienteConta | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchProfile(user.id);
      setProfile(p?.ativo ? p : null);
    } catch {
      setProfile(null);
    }
  }, [user?.id]);

  const refreshClienteConta = useCallback(async () => {
    if (!user?.id) {
      setClienteConta(null);
      return;
    }
    try {
      const conta = await fetchClienteConta(user.id);
      setClienteConta(contaClienteAtiva(conta) ? conta : null);
    } catch {
      setClienteConta(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setClienteConta(null);
      return;
    }
    void refreshProfile();
    void refreshClienteConta();
  }, [user?.id, refreshProfile, refreshClienteConta]);

  const signIn = useCallback(async (usuario: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    const login = normalizeUsuario(usuario);
    if (!login) throw new Error('Usuário ou senha inválidos.');

    const { data: email, error: lookupError } = await supabase.rpc('hub_email_for_usuario', {
      p_usuario: login,
    });

    if (lookupError || !email) {
      throw new Error('Usuário ou senha inválidos.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(supabaseErrorMessage(error));

    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) throw new Error('Sessão inválida.');

    const p = await fetchProfile(uid);
    if (!p?.ativo) {
      await supabase.auth.signOut();
      throw new Error('Esta conta não tem acesso ao NexusHub. Use o NexusClient.');
    }
  }, []);

  const signInCliente = useCallback(async (usuario: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const login = normalizeUsuario(usuario);
    if (!login) throw new Error('Usuário ou senha inválidos.');

    const { data: email, error: lookupError } = await supabase.rpc('hub_email_for_cliente_usuario', {
      p_usuario: login,
    });

    if (lookupError || !email) {
      throw new Error('Usuário ou senha inválidos.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(supabaseErrorMessage(error));

    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) throw new Error('Sessão inválida.');

    const conta = await fetchClienteConta(uid);
    if (!contaClienteAtiva(conta)) {
      await supabase.auth.signOut();
      throw new Error('Esta conta não está habilitada no NexusClient. Contacte a NEXUS.');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setClienteConta(null);
  }, []);

  const email = normalizeEmail(user?.email ?? profile?.email ?? clienteConta?.email);
  const podeFinanceiroAgenda = podeAcessarFinanceiroAgenda(email);
  const podeGestao = podeGerenciar(profile?.cargo);
  const isEquipe = Boolean(profile?.ativo);
  const isCliente = contaClienteAtiva(clienteConta);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile,
      clienteConta,
      isEquipe,
      isCliente,
      loading,
      configured: supabaseConfigured,
      podeFinanceiroAgenda,
      podeGestao,
      signIn,
      signInCliente,
      signOut,
      refreshProfile,
      refreshClienteConta,
    }),
    [
      session,
      user,
      profile,
      clienteConta,
      isEquipe,
      isCliente,
      loading,
      podeFinanceiroAgenda,
      podeGestao,
      signIn,
      signInCliente,
      signOut,
      refreshProfile,
      refreshClienteConta,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
