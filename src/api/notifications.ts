import { apiClient } from './client';

export interface Notification {
  id: string;
  title: string;
  content: string;
  content_format?: string; // text, markdown, html
  type: string;
  is_read: boolean;
  created_at: string;
  metadata_json?: Record<string, any>;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
  skip: number;
  limit: number;
}

export const notificationsApi = {
  list: async (skip = 0, limit = 20) => {
    const response = await apiClient.get<NotificationListResponse>('/client/notifications/', {
      params: { skip, limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<number>('/client/notifications/unread-count');
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await apiClient.patch<Notification>(`/client/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.post<{ count: number }>('/client/notifications/read-all');
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/client/notifications/${id}`);
  },
};
