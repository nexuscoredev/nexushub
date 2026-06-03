import { createContext, useContext, useState, type ReactNode } from 'react';
import { AppUpdatePrompt } from '../components/AppUpdatePrompt';
import { useAppUpdate } from '../hooks/useAppUpdate';

interface AppUpdateContextValue {
  updateAvailable: boolean;
  checking: boolean;
  applyUpdate: () => void;
  checkForUpdate: () => Promise<boolean>;
}

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const { updateAvailable, checking, applyUpdate, checkForUpdate } = useAppUpdate();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <AppUpdateContext.Provider
      value={{ updateAvailable, checking, applyUpdate, checkForUpdate }}
    >
      {children}
      {updateAvailable && !bannerDismissed ? (
        <AppUpdatePrompt
          onUpdate={applyUpdate}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdateContext(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error('useAppUpdateContext must be used within AppUpdateProvider');
  }
  return ctx;
}
