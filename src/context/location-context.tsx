import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const STORAGE_KEYS = {
  FARMER_LOCATION: '@kissan_saathi_farmer_location',
};

export interface FarmerLocation {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  formattedAddress: string;
  pincode?: string;
  isAutoDetected: boolean;
  timestamp?: number;
}

const DEFAULT_LOCATION: FarmerLocation = {
  latitude: 21.1458,
  longitude: 79.0882,
  city: 'Nagpur',
  district: 'Nagpur',
  state: 'Maharashtra',
  formattedAddress: 'Nagpur, Maharashtra',
  pincode: '440001',
  isAutoDetected: false,
};

interface LocationContextType {
  location: FarmerLocation;
  isLoading: boolean;
  permissionStatus: Location.PermissionStatus | 'undetermined';
  errorMessage: string | null;
  fetchCurrentLocation: () => Promise<FarmerLocation | null>;
  setManualLocation: (loc: Partial<FarmerLocation>) => Promise<void>;
  isLocationAvailable: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<FarmerLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    Location.PermissionStatus | 'undetermined'
  >('undetermined');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved location on startup
  useEffect(() => {
    let isMounted = true;

    async function loadSavedLocation() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.FARMER_LOCATION);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          setLocation(parsed);
        }
      } catch (e) {
        console.warn('Failed to load saved location:', e);
      }
    }

    loadSavedLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const reverseGeocodeSafe = async (
    latitude: number,
    longitude: number
  ): Promise<{ city: string; district: string; state: string; formatted: string; pincode?: string }> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const item = results[0];
        const city = item.city || item.subregion || item.district || item.name || 'Local Area';
        const district = item.district || item.subregion || item.city || '';
        const state = item.region || item.country || 'India';
        const pincode = item.postalCode || undefined;
        const formatted = district && district !== state
          ? `${city}, ${state}`
          : `${city}, ${state}`;

        return { city, district, state, formatted, pincode };
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    }
    return {
      city: 'Detected Location',
      district: '',
      state: 'India',
      formatted: `${latitude.toFixed(3)}° N, ${longitude.toFixed(3)}° E`,
    };
  };

  const fetchCurrentLocation = useCallback(async (): Promise<FarmerLocation | null> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Request Foreground Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMessage('Location permission was denied. Please allow location access to find nearby mandis.');
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Location Permission Required',
            'Please enable GPS location to automatically find APMC Mandis and procurement centers closest to your farm.',
            [{ text: 'OK' }]
          );
        }
        setIsLoading(false);
        return null;
      }

      // 2. Fetch Current GPS Position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      // 3. Reverse Geocode to obtain Farmer's District / State
      const geo = await reverseGeocodeSafe(latitude, longitude);

      const newLocation: FarmerLocation = {
        latitude,
        longitude,
        city: geo.city,
        district: geo.district,
        state: geo.state,
        formattedAddress: geo.formatted,
        pincode: geo.pincode,
        isAutoDetected: true,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      await AsyncStorage.setItem(
        STORAGE_KEYS.FARMER_LOCATION,
        JSON.stringify(newLocation)
      );

      setIsLoading(false);
      return newLocation;
    } catch (error: any) {
      console.warn('Error fetching location:', error);
      setErrorMessage(error?.message || 'Could not detect location. Please check your GPS.');
      setIsLoading(false);
      return null;
    }
  }, []);

  const setManualLocation = useCallback(async (locData: Partial<FarmerLocation>) => {
    const updated: FarmerLocation = {
      ...location,
      ...locData,
      isAutoDetected: false,
      timestamp: Date.now(),
    };
    setLocation(updated);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FARMER_LOCATION,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn('Failed to save manual location:', e);
    }
  }, [location]);

  const value = useMemo(
    () => ({
      location,
      isLoading,
      permissionStatus,
      errorMessage,
      fetchCurrentLocation,
      setManualLocation,
      isLocationAvailable: !!(location && location.latitude && location.longitude),
    }),
    [
      location,
      isLoading,
      permissionStatus,
      errorMessage,
      fetchCurrentLocation,
      setManualLocation,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useFarmerLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useFarmerLocation must be used within a LocationProvider');
  }
  return context;
}
