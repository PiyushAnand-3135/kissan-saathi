import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageCode,
  translations,
  TranslationKey,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '@/constants/translations';
import {
  ThemeMode,
  AppThemePalette,
  lightTheme,
  darkTheme,
} from '@/constants/theme';

const STORAGE_KEYS = {
  LANGUAGE: '@kissan_saathi_language',
  THEME_MODE: '@kissan_saathi_theme_mode',
};

interface SettingsContextType {
  // Language
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  t: (key: TranslationKey) => string;

  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  theme: AppThemePalette;

  // Status
  isReady: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Load saved preferences on startup safely
  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const [savedLanguage, savedTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
        ]);

        if (!isMounted) return;

        if (
          savedLanguage &&
          SUPPORTED_LANGUAGES.some((item) => item.code === savedLanguage)
        ) {
          setLanguageState(savedLanguage as LanguageCode);
        }

        if (
          savedTheme &&
          (savedTheme === 'light' ||
            savedTheme === 'dark' ||
            savedTheme === 'system')
        ) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load settings preferences from storage:', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
    } catch (error) {
      console.warn('Failed to save language to storage:', error);
    }
  }, []);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
    } catch (error) {
      console.warn('Failed to save theme mode to storage:', error);
    }
  }, []);

  // Compute active dark state
  const isDark = useMemo(() => {
    if (themeMode === 'light') return false;
    if (themeMode === 'dark') return true;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  // Compute theme palette
  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      const activeTranslations = translations[language] || translations.en;
      return (
        activeTranslations[key] ||
        translations.en[key] ||
        key
      );
    },
    [language]
  );

  const currentLanguageOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((item) => item.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageOption,
      t,
      themeMode,
      setThemeMode,
      isDark,
      theme,
      isReady,
    }),
    [
      language,
      setLanguage,
      currentLanguageOption,
      t,
      themeMode,
      setThemeMode,
      isDark,
      theme,
      isReady,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
