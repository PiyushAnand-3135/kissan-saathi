import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { apiFetch } from '@/lib/api';
import { enqueue, flush, pendingCount, subscribe } from '@/lib/outbox';
import { useFarmer } from '@/context/farmer-context';
import { useSettings } from '@/context/settings-context';

const FLUSH_INTERVAL_MS = 30000;

interface SyncContextType {
  pendingCount: number;
  syncNow: (force?: boolean) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { farmerId, farmer } = useFarmer();
  const { currentLanguageOption } = useSettings();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => setPending(await pendingCount()), []);

  const syncNow = useCallback(
    async (force = false) => {
      await flush(force);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
    const unsubscribe = subscribe(refresh);
    syncNow(true);
    const timer = setInterval(() => syncNow(), FLUSH_INTERVAL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow(true);
    });
    return () => {
      unsubscribe();
      clearInterval(timer);
      appState.remove();
    };
  }, [refresh, syncNow]);

  const profileKey = JSON.stringify([farmerId, farmer?.name, farmer?.primaryCrops]);
  useEffect(() => {
    const [id, name, crops] = JSON.parse(profileKey) as [string | null, string | undefined, string[] | undefined];
    if (!id || !name) return;
    // Registration otherwise lives only on the phone, so the dashboard could not list this farmer.
    enqueue({
      id: `profile-${profileKey}`,
      path: `/farmer/${id}/profile`,
      method: 'PUT',
      body: { name, primary_crops: crops ?? [] },
    })
      .then(refresh)
      .catch(() => undefined);
  }, [profileKey, refresh]);

  useEffect(() => {
    if (!farmerId || !currentLanguageOption?.code) return;
    apiFetch(`/farmer/${farmerId}/prefs`, { method: 'PUT', body: { language: currentLanguageOption.code } }).catch(
      () => undefined
    );
  }, [farmerId, currentLanguageOption?.code]);

  const value = useMemo(() => ({ pendingCount: pending, syncNow }), [pending, syncNow]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
}
