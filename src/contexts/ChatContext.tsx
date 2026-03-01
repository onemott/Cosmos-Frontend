import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chat';
import { ChatMessage, ChatSession, ChatSessionListResponse } from '../types/api';
import { tokenStorage, apiClient } from '../api/client';

interface ChatContextType {
  isConnected: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (content: string, type?: "text" | "image" | "file") => void;
  selectSession: (sessionId: string) => void;
  markAsRead: (sessionId: string) => void;
  refreshSessions: () => void;
  isLoading: boolean;
  totalUnread: number;
  leaveSession: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const appStateRef = useRef(AppState.currentState);
  const sessionsRef = useRef(sessions);

  // Keep sessionsRef in sync with sessions state
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      // Only set loading if we don't have sessions yet to avoid flickering
      if (sessionsRef.current.length === 0) {
        setIsLoading(true);
      }
      const response = await chatApi.getSessions();
      if (response && response.sessions) {
        setSessions(response.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "message") {
      // Handle flat structure (new) or nested structure (old)
      const message = (data.data || data) as ChatMessage;
      
      setMessages((prev) => {
        const sessionMessages = prev[message.session_id] || [];
        // Check for duplicate by id or client_side_id
        const existingIndex = sessionMessages.findIndex(m => 
          m.id === message.id || (message.client_side_id && m.client_side_id === message.client_side_id)
        );
        
        if (existingIndex !== -1) {
          // Replace existing message (e.g. optimistic one) with real one
          const newMessages = [...sessionMessages];
          newMessages[existingIndex] = message;
          return {
            ...prev,
            [message.session_id]: newMessages,
          };
        }
        
        return {
          ...prev,
          [message.session_id]: [...sessionMessages, message],
        };
      });

      // Check if session exists in current list using ref to avoid dependency cycle
      const sessionExists = sessionsRef.current.some(s => s.id === message.session_id);

      if (!sessionExists) {
        console.log("Received message for new/unknown session, refreshing list...");
        fetchSessions();
        // Continue to add message to state so it's available immediately
      }

      setSessions((prev) => {
        return prev.map(session => {
          if (session.id === message.session_id) {
            const isCurrentSession = currentSessionId === message.session_id;
            return {
              ...session,
              last_message: message.content_type === 'text' ? message.content : `[${message.content_type}]`,
              last_message_at: message.created_at,
              unread_count: isCurrentSession ? 0 : session.unread_count + 1,
            };
          }
          return session;
        }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      });
    }
  }, [currentSessionId, fetchSessions]);

  const connectWebSocket = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const token = await tokenStorage.getAccessToken();
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const baseUrl = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api/v1";
    // Replace http/https with ws/wss
    const wsUrl = baseUrl.replace(/^http/, "ws") + `/ws?token=${token}`;

    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Chat WebSocket connected");
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Chat WebSocket disconnected");
      setIsConnected(false);
      // Reconnect if app is active
      if (appStateRef.current === 'active') {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
      ws.close();
    };

    wsRef.current = ws;
  }, [isAuthenticated, handleWebSocketMessage]);

  // Handle App State changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        fetchSessions();
        connectWebSocket();
      } else if (nextAppState.match(/inactive|background/)) {
        if (wsRef.current) {
           wsRef.current.close();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fetchSessions, connectWebSocket]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsConnected(false);
      setSessions([]);
      setMessages({});
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, fetchSessions, connectWebSocket]);

  const sendMessage = useCallback(async (content: string, type: "text" | "image" | "file" = "text") => {
    if (!currentSessionId) {
      console.warn("No session selected");
      return;
    }

    const clientSideId = Math.random().toString(36).substring(7);
    
    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: clientSideId, // Temporary ID
      session_id: currentSessionId,
      sender_type: 'client', // Assume current user is client
      sender_id: 'self', // Placeholder
      content: content,
      content_type: type,
      created_at: new Date().toISOString(),
      client_side_id: clientSideId,
    };

    setMessages((prev) => {
      const sessionMessages = prev[currentSessionId] || [];
      return {
        ...prev,
        [currentSessionId]: [...sessionMessages, optimisticMessage],
      };
    });

    // Try WebSocket first, fallback to HTTP
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        session_id: currentSessionId,
        content: content,
        message_type: type,
        content_type: type, // For backward compatibility
        client_side_id: clientSideId,
      };
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Use HTTP fallback
      console.log("WebSocket not available, using HTTP fallback");
      try {
        await chatApi.sendMessage(currentSessionId, content, type, clientSideId);
        console.log("Message sent via HTTP successfully");
      } catch (error) {
        console.error("Failed to send message via HTTP:", error);
      }
    }
  }, [currentSessionId]);

  const selectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    
    // Fetch history
    try {
      const history = await chatApi.getHistory(sessionId);
      
      let msgs = history;
      if (msgs.length > 1) {
          const first = new Date(msgs[0].created_at).getTime();
          const last = new Date(msgs[msgs.length - 1].created_at).getTime();
          if (first > last) {
              msgs.reverse();
          }
      }
      
      setMessages((prev) => ({
        ...prev,
        [sessionId]: msgs,
      }));
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }

    // Mark as read
    try {
      await chatApi.markRead(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unread_count: 0 } : s));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const markAsRead = useCallback(async (sessionId: string) => {
      try {
        await chatApi.markRead(sessionId);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unread_count: 0 } : s));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
  }, []);

  const leaveSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  const totalUnread = sessions.reduce((sum, s) => sum + s.unread_count, 0);

  return (
    <ChatContext.Provider value={{
      isConnected,
      sessions,
      currentSessionId,
      messages,
      sendMessage,
      selectSession,
      markAsRead,
      refreshSessions: fetchSessions,
      isLoading,
      totalUnread,
      leaveSession
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
