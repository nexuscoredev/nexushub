import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APP_UPDATE_POLL_MS,
  applyHardRefresh,
  fetchRemoteBuildId,
  getLoadedBuildId,
} from '../lib/appUpdate';

export function useAppUpdate() {
  const loadedIdRef = useRef(getLoadedBuildId());
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (import.meta.env.DEV) return false;

    const loaded = loadedIdRef.current;
    if (!loaded) return false;

    setChecking(true);
    try {
      const remote = await fetchRemoteBuildId();
      if (remote && remote !== loaded) {
        setUpdateAvailable(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void applyHardRefresh();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    void checkForUpdate();

    const interval = window.setInterval(() => {
      void checkForUpdate();
    }, APP_UPDATE_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkForUpdate]);

  return { updateAvailable, checking, checkForUpdate, applyUpdate };
}
