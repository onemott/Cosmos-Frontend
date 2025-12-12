import Constants from 'expo-constants';

export const ENV = {
  API_BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || 'http://127.0.0.1:8000/api/v1',
  API_TIMEOUT: 30000,
};

