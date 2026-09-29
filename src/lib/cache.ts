import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, apiFetch } from './api';

export interface Cached<T> {
  data: T;
  stale: boolean;
  savedAt: number | null;
}

const keyFor = (farmerId: string, name: string) => `@kissan_saathi_cache_${farmerId}_${name}`;

// Network first. If the network is unreachable or the server is down, fall back to
// the last good copy. Client errors (4xx) are real answers and are never masked.
export async function cachedGet<T>(farmerId: string, name: string, path: string): Promise<Cached<T>> {
  const key = keyFor(farmerId, name);
  try {
    const data = await apiFetch<T>(path);
    const savedAt = Date.now();
    AsyncStorage.setItem(key, JSON.stringify({ data, savedAt })).catch(() => undefined);
    return { data, stale: false, savedAt };
  } catch (error) {
    if (!(error instanceof ApiError) || !error.isOffline) throw error;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) throw error;
    const saved = JSON.parse(raw) as { data: T; savedAt: number };
    return { data: saved.data, stale: true, savedAt: saved.savedAt };
  }
}
