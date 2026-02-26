import { apiClient } from './client';

export interface SystemConfig {
  key: string;
  value: string;
  version: string;
  description?: string;
  is_public: boolean;
  updated_at: string;
}

export interface AgreementStatus {
  accepted: boolean;
  version?: string;
  latest_version?: string;
}

export const systemApi = {
  getConfig: async (key: string): Promise<SystemConfig> => {
    const response = await apiClient.get<SystemConfig>(`/system/config/${key}`);
    return response.data;
  },

  recordAgreement: async (type: string, version: string) => {
    const response = await apiClient.post('/client/agreements/', {
      agreement_type: type,
      version: version,
      user_agent: 'Cosmos-App', // In real app, get from device info
    });
    return response.data;
  },

  getAgreementStatus: async (type: string = 'privacy_policy') => {
    const response = await apiClient.get<Record<string, AgreementStatus>>(`/client/agreements/status?agreement_type=${type}`);
    return response.data[type];
  },
};
