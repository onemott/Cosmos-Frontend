/**
 * Language Context for the client app.
 * Manages language preference with local persistence via AsyncStorage
 * and backend synchronization.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages
export type Language = 'en' | 'zh-CN';

export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
];

const STORAGE_KEY = 'cosmos-client-language';
const DEFAULT_LANGUAGE: Language = 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
  syncFromBackend: (backendLanguage: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Load language from AsyncStorage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && (stored === 'en' || stored === 'zh-CN')) {
          setLanguageState(stored as Language);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      }
      setIsLoading(false);
    };

    loadLanguage();
  }, []);

  // Sync language from backend (called when profile is fetched)
  const syncFromBackend = useCallback((backendLanguage: string) => {
    if (backendLanguage === 'en' || backendLanguage === 'zh-CN') {
      setLanguageState(backendLanguage as Language);
      // Also persist to local storage
      AsyncStorage.setItem(STORAGE_KEY, backendLanguage).catch((error) => {
        console.warn('Failed to sync language to local storage:', error);
      });
    }
  }, []);

  // Set language and persist to AsyncStorage
  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, syncFromBackend }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

