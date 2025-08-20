// hooks/useWebSocket.ts
import { useState, useEffect, useRef } from 'react';

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: any) => boolean;
  disconnect: () => void;
  reconnect: () => void;
}

export const useWebSocket = (
  url: string,
  onMessage?: (data: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef<number | null>(null);

  const connect = () => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Add the token as a query parameter
      const wsUrl = new URL(url);
      wsUrl.searchParams.append('token', token);
      
      console.log('Connecting to WebSocket with token:', token.substring(0, 20) + '...');
      
      const ws = new WebSocket(wsUrl.toString());
     
      ws.onopen = () => {
        console.log('WebSocket connected to:', url);
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        if (onConnect) onConnect();
      };
     
      ws.onmessage = (event) => {
        if (onMessage) {
          const data = JSON.parse(event.data);
          onMessage(data);
        }
      };
     
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        if (onDisconnect) onDisconnect();
       
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
         
          reconnectInterval.current = setTimeout(() => {
            connect();
          }, 3000 * reconnectAttempts.current); // Exponential backoff
        }
      };
     
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };
     
      setSocket(ws);
     
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish connection');
    }
  };

  const disconnect = () => {
    if (reconnectInterval.current) {
      clearTimeout(reconnectInterval.current);
    }
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (url) {
      connect();
    }
   
    return () => {
      disconnect();
    };
  }, [url]);

  return {
    socket,
    isConnected,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};