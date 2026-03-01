import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // If explicitly defined in app.json/app.config.js
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    return Constants.expoConfig.extra.apiBaseUrl;
  }

  // If hostUri is available (physical device or LAN), use it
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:8000/api/v1`;
  }

  // Web environment check
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000/api/v1`;
    }
  } catch (e) {
    // Ignore error
  }

  // Fallback for emulators
  // Android Emulator uses 10.0.2.2 to access host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  
  // iOS Simulator uses localhost
  return 'http://localhost:8000/api/v1'; 
};

export const ENV = {
  API_BASE_URL: getApiUrl(),
  API_TIMEOUT: 30000,
};

