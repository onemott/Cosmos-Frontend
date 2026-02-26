import Constants from 'expo-constants';

const getApiUrl = () => {
  // If explicitly defined in app.json/app.config.js
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    return Constants.expoConfig.extra.apiBaseUrl;
  }

  // For physical devices connecting to the dev server
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:8000/api/v1`;
  }

  // Fallback for web or when hostUri is not available
  // Use localhost for web, but for Android Emulator use 10.0.2.2
  // For web, we should check if we are running in browser and use window.location.hostname
  // Check if window is defined (web environment)
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      // If we are on localhost, use localhost:8000
      // If we are on 127.0.0.1, use 127.0.0.1:8000
      // If we are on a network IP, use that IP:8000
      return `http://${hostname}:8000/api/v1`;
    }
  } catch (e) {
    // Ignore error if window is not defined
  }
  return 'http://localhost:8000/api/v1';
};

export const ENV = {
  API_BASE_URL: getApiUrl(),
  API_TIMEOUT: 30000,
};

