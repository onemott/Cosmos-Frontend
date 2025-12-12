import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../api/client';
import { useLogin, useLogout, useClientProfile } from '../api/hooks';
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

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { data: user, isLoading: isLoadingProfile, refetch } = useClientProfile(isAuthenticated);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getAccessToken();
      setIsAuthenticated(!!token);
      setIsInitializing(false);
    };
    checkAuth();
  }, []);

  // Refetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      refetch();
    }
  }, [isAuthenticated, isInitializing, refetch]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync({ email, password });
    await tokenStorage.setTokens(response.access_token, response.refresh_token);
    setIsAuthenticated(true);
  }, [loginMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setIsAuthenticated(false);
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

