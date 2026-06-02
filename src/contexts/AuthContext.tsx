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
import { podeGerenciar } from '../lib/cargos';
import { podeAcessarFinanceiroAgenda, normalizeEmail } from '../lib/acesso';
import { supabase, supabaseConfigured, supabaseErrorMessage } from '../lib/supabase';
import type { HubCargo, HubProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: HubProfile | null;
  loading: boolean;
  configured: boolean;
  podeFinanceiroAgenda: boolean;
  podeGestao: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    meta: { nome: string; cargo: HubCargo },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HubProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchProfile(user.id);
      setProfile(p);
    } catch {
      setProfile(null);
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
      return;
    }
    void refreshProfile();
  }, [user?.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(supabaseErrorMessage(error));
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      meta: { nome: string; cargo: HubCargo },
    ) => {
      if (!supabase) throw new Error('Supabase não configurado.');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome: meta.nome, cargo: meta.cargo },
        },
      });
      if (error) throw new Error(supabaseErrorMessage(error));
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const email = normalizeEmail(user?.email ?? profile?.email);
  const podeFinanceiroAgenda = podeAcessarFinanceiroAgenda(email);
  const podeGestao = podeGerenciar(profile?.cargo);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile,
      loading,
      configured: supabaseConfigured,
      podeFinanceiroAgenda,
      podeGestao,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      podeFinanceiroAgenda,
      podeGestao,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
