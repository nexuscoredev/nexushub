import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { unlockVaultKey } from '../lib/vaultCrypto';
import { fetchVaultConfig, type HubVaultConfig } from '../lib/vault';
import { useAuth } from './AuthContext';

interface VaultState {
  config: HubVaultConfig | null;
  configLoading: boolean;
  unlocked: boolean;
  cryptoKey: CryptoKey | null;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  setCryptoKey: (key: CryptoKey | null) => void;
  refreshConfig: () => Promise<void>;
}

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, podeGestao } = useAuth();
  const [config, setConfig] = useState<HubVaultConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const refreshConfig = useCallback(async () => {
    if (!session || !podeGestao) {
      setConfig(null);
      setConfigLoading(false);
      return;
    }
    setConfigLoading(true);
    try {
      const row = await fetchVaultConfig();
      setConfig(row);
    } finally {
      setConfigLoading(false);
    }
  }, [session, podeGestao]);

  useEffect(() => {
    if (authLoading) return;
    void refreshConfig();
  }, [authLoading, refreshConfig]);

  useEffect(() => {
    if (!session) {
      setCryptoKey(null);
      setConfig(null);
    }
  }, [session]);

  const lock = useCallback(() => setCryptoKey(null), []);

  const unlock = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      if (!config) return false;
      const key = await unlockVaultKey(masterPassword, config.kdf_salt, {
        iv: config.verifier_iv,
        ciphertext: config.verifier_ciphertext,
      });
      if (!key) return false;
      setCryptoKey(key);
      return true;
    },
    [config]
  );

  const value = useMemo(
    () => ({
      config,
      configLoading,
      unlocked: cryptoKey !== null,
      cryptoKey,
      unlock,
      lock,
      setCryptoKey,
      refreshConfig,
    }),
    [config, configLoading, cryptoKey, unlock, lock, refreshConfig]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultState {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault deve ser usado dentro de VaultProvider');
  return ctx;
}
