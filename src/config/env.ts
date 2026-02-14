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
  return 'http://127.0.0.1:8000/api/v1';
};

export const ENV = {
  API_BASE_URL: getApiUrl(),
  API_TIMEOUT: 30000,
};

