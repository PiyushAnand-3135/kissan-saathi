import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kissan_saathi_farmer_profile';

export interface FarmerProfile {
  name: string;
  phone: string; // used as farmer_id everywhere -- including the RAG backend
  primaryCrops: string[];
  // No village/district here on purpose -- that's what the existing
  // location-context (useFarmerLocation) already owns, with real GPS
  // detection, reverse geocoding, and its own persistence. Storing a
  // second, manually-typed copy here was exactly the bug that made
  // registration and the profile screen show two different places.
}

interface FarmerContextType {
  isRegistered: boolean;
  farmer: FarmerProfile | null;
  farmerId: string | null; // convenience alias for farmer?.phone
  isReady: boolean;
  registerFarmer: (profile: FarmerProfile) => Promise<void>;
  updateFarmer: (updates: Partial<FarmerProfile>) => Promise<void>;
  clearFarmer: () => Promise<void>; // DPDP-style local deletion, pairs with backend /farmer/{id} DELETE
}

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && saved) {
          setFarmer(JSON.parse(saved) as FarmerProfile);
        }
      } catch (error) {
        console.warn('Failed to load farmer profile from storage:', error);
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const registerFarmer = useCallback(async (profile: FarmerProfile) => {
    setFarmer(profile);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to save farmer profile:', error);
    }
  }, []);

  const updateFarmer = useCallback(
    async (updates: Partial<FarmerProfile>) => {
      setFarmer((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
          console.warn('Failed to save farmer profile:', error)
        );
        return next;
      });
    },
    []
  );

  const clearFarmer = useCallback(async () => {
    setFarmer(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear farmer profile:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      isRegistered: farmer !== null,
      farmer,
      farmerId: farmer?.phone ?? null,
      isReady,
      registerFarmer,
      updateFarmer,
      clearFarmer,
    }),
    [farmer, isReady, registerFarmer, updateFarmer, clearFarmer]
  );

  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
}
