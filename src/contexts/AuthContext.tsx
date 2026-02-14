import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { tokenStorage, setAuthFailedCallback, clearAuthFailedCallback } from '../api/client';
import { useLogin, useLogout, useClientProfile } from '../api/hooks';
import { useBranding } from './BrandingContext';
import type { ClientProfile } from '../types/api';

interface AuthContextType {
  user: ClientProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const isValidatingRef = useRef(false);
  
  const { setBranding } = useBranding();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { data: user, isLoading: isLoadingProfile, refetch } = useClientProfile(isAuthenticated);

  // Handle auth failure from API client (token refresh failed)
  const handleAuthFailed = useCallback(() => {
    console.log('[AuthContext] Auth failed - logging out');
    setIsAuthenticated(false);
  }, []);

  // Register auth failed callback on mount
  useEffect(() => {
    setAuthFailedCallback(handleAuthFailed);
    return () => {
      clearAuthFailedCallback();
    };
  }, [handleAuthFailed]);

  // Validate token on mount - not just check existence
  useEffect(() => {
    const validateAuth = async () => {
      // Prevent duplicate validation
      if (isValidatingRef.current) return;
      isValidatingRef.current = true;

      try {
        const token = await tokenStorage.getAccessToken();
        
        if (!token) {
          console.log('[AuthContext] No token found');
          setIsAuthenticated(false);
          setIsInitializing(false);
          return;
        }

        console.log('[AuthContext] Token found, validating...');
        
        // Validate token by making a request
        const isValid = await tokenStorage.validateToken();
        
        if (isValid) {
          console.log('[AuthContext] Token is valid');
          setIsAuthenticated(true);
        } else {
          console.log('[AuthContext] Token is invalid or expired');
          // Clear invalid tokens
          await tokenStorage.clearTokens();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error validating auth:', error);
        // On any error, assume not authenticated
        await tokenStorage.clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
        isValidatingRef.current = false;
      }
    };

    validateAuth();
  }, []);

  // Refetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      refetch();
    }
  }, [isAuthenticated, isInitializing, refetch]);

  // Update branding when user profile is loaded/updated
  useEffect(() => {
    if (user?.tenant_branding) {
      setBranding(user.tenant_branding);
    }
  }, [user?.tenant_branding, setBranding]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync({ email, password });
    await tokenStorage.setTokens(response.access_token, response.refresh_token);
    
    // Set tenant branding from login response
    if (response.tenant_branding) {
      setBranding(response.tenant_branding);
    }
    
    setIsAuthenticated(true);
  }, [loginMutation, setBranding]);

  const logout = useCallback(async () => {
    // Clear local state first to ensure UI updates immediately
    // This prevents the user from being stuck if the network request fails
    await tokenStorage.clearTokens();
    setIsAuthenticated(false);

    try {
      // Attempt server-side logout, but don't block UI
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Ignore logout errors - we're logging out anyway
      console.log('[AuthContext] Logout request failed, clearing local state');
    }
  }, [logoutMutation]);

  const isLoading = isInitializing || (isAuthenticated && isLoadingProfile);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
