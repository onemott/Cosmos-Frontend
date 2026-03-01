import { apiClient } from './client';
import { ChatSession, ChatMessage, ChatSessionListResponse } from '../types/api';

export const chatApi = {
  getSessions: async (skip = 0, limit = 20) => {
    const response = await apiClient.get<ChatSessionListResponse>('/client/chat/sessions', {
      params: { skip, limit },
    });
    return response.data;
  },

  createSession: async () => {
    const response = await apiClient.post<ChatSession>('/client/chat/sessions');
    return response.data;
  },

  getHistory: async (sessionId: string, skip = 0, limit = 50) => {
    const response = await apiClient.get<ChatMessage[]>(`/client/chat/sessions/${sessionId}/history`, {
      params: { skip, limit },
    });
    return response.data;
  },

  markRead: async (sessionId: string) => {
    const response = await apiClient.post(`/client/chat/sessions/${sessionId}/read`);
    return response.data;
  },

  // HTTP fallback for sending messages when WebSocket is unavailable
  sendMessage: async (sessionId: string, content: string, contentType: string = 'text', clientSideId?: string) => {
    const response = await apiClient.post<ChatMessage>('/client/chat/messages', {
      session_id: sessionId,
      content,
      content_type: contentType,
      client_side_id: clientSideId,
    });
    return response.data;
  },
};
