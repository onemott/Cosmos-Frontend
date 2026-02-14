import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { ENV } from '../config/env';

const TOKEN_KEY = 'cosmos_access_token';
const REFRESH_TOKEN_KEY = 'cosmos_refresh_token';

// Auth state listener - will be set by AuthContext
let onAuthFailedCallback: (() => void) | null = null;

export const setAuthFailedCallback = (callback: () => void) => {
  onAuthFailedCallback = callback;
};

export const clearAuthFailedCallback = () => {
  onAuthFailedCallback = null;
};

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh lock to prevent race conditions when multiple requests fail at once
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

// Request interceptor: Attach token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (token expired) and 403 (deactivated)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 403 "Account deactivated" - clear tokens and logout
    if (error.response?.status === 403) {
      const errorData = error.response.data as { detail?: string } | undefined;
      if (errorData?.detail?.toLowerCase().includes('deactivated')) {
        // Clear tokens and notify auth context
        await storage.deleteItem(TOKEN_KEY);
        await storage.deleteItem(REFRESH_TOKEN_KEY);
        
        if (onAuthFailedCallback) {
          onAuthFailedCallback();
        }
        
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for the new token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${ENV.API_BASE_URL}/client/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        await storage.setItem(TOKEN_KEY, access_token);
        await storage.setItem(REFRESH_TOKEN_KEY, refresh_token);

        isRefreshing = false;
        onTokenRefreshed(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();
        
        // Refresh failed, clear tokens and notify AuthContext
        await storage.deleteItem(TOKEN_KEY);
        await storage.deleteItem(REFRESH_TOKEN_KEY);
        
        // Notify AuthContext that auth has failed
        if (onAuthFailedCallback) {
          onAuthFailedCallback();
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management helpers
export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await storage.setItem(TOKEN_KEY, accessToken);
    await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  async getAccessToken() {
    return await storage.getItem(TOKEN_KEY);
  },
  async getRefreshToken() {
    return await storage.getItem(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(REFRESH_TOKEN_KEY);
  },
  
  /**
   * Validate token by making a test request.
   * Returns true if authenticated, false if not.
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) {
        return false;
      }
      
      // Make a lightweight request to validate the token
      const response = await apiClient.get('/client/auth/me');
      return response.status === 200;
    } catch (error) {
      // If 401 and refresh also failed, tokens are already cleared
      return false;
    }
  },
};
