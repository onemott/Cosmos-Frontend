import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Platform-agnostic storage utility.
 * Uses SecureStore on native (iOS/Android) and localStorage on Web.
 * 
 * Note: localStorage is NOT secure, but it's the standard for Web.
 * For production web apps, consider using httpOnly cookies for tokens.
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('LocalStorage error:', e);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};
