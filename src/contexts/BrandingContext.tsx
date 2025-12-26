import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TenantBranding } from '../types/api';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_APP_NAME } from '../config/branding';

const BRANDING_CACHE_KEY = '@cosmos_tenant_branding';

interface BrandingContextType {
  branding: TenantBranding | null;
  isLoading: boolean;
  setBranding: (branding: TenantBranding | null) => Promise<void>;
  clearBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached branding on mount
  useEffect(() => {
    const loadCachedBranding = async () => {
      try {
        const cached = await AsyncStorage.getItem(BRANDING_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as TenantBranding;
          setBrandingState(parsed);
          console.log('[BrandingContext] Loaded cached branding:', parsed.app_name);
        }
      } catch (error) {
        console.error('[BrandingContext] Error loading cached branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedBranding();
  }, []);

  // Set branding and cache it
  const setBranding = useCallback(async (newBranding: TenantBranding | null) => {
    setBrandingState(newBranding);
    
    try {
      if (newBranding) {
        await AsyncStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(newBranding));
        console.log('[BrandingContext] Cached branding for:', newBranding.app_name);
      } else {
        await AsyncStorage.removeItem(BRANDING_CACHE_KEY);
        console.log('[BrandingContext] Cleared branding cache');
      }
    } catch (error) {
      console.error('[BrandingContext] Error caching branding:', error);
    }
  }, []);

  // Clear branding (on logout)
  const clearBranding = useCallback(async () => {
    setBrandingState(null);
    try {
      await AsyncStorage.removeItem(BRANDING_CACHE_KEY);
      console.log('[BrandingContext] Cleared branding cache');
    } catch (error) {
      console.error('[BrandingContext] Error clearing branding cache:', error);
    }
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, setBranding, clearBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};

/**
 * Helper hook to get the display app name.
 * Falls back to DEFAULT_APP_NAME if no tenant branding.
 */
export const useAppName = () => {
  const { branding } = useBranding();
  return branding?.app_name || DEFAULT_APP_NAME;
};

/**
 * Helper hook to get the primary brand color.
 * Falls back to DEFAULT_PRIMARY_COLOR if no tenant branding.
 */
export const usePrimaryColor = () => {
  const { branding } = useBranding();
  return branding?.primary_color || DEFAULT_PRIMARY_COLOR;
};

/**
 * Helper hook to get the logo URL if available.
 */
export const useLogoUrl = () => {
  const { branding } = useBranding();
  if (!branding?.has_logo || !branding?.logo_url) {
    return null;
  }
  // The logo_url from backend is relative, need to prepend base URL
  // This will be handled by the component that uses it
  return branding.logo_url;
};

