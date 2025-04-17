import { useState, useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { WhatsAppSession } from "@shared/schema";

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionUpdates, setSessionUpdates] = useState<Record<number, WhatsAppSession>>({});
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };
      
      socket.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "session-update") {
            const session = data.data as WhatsAppSession;
            setSessionUpdates(prev => ({
              ...prev,
              [session.profileId]: session
            }));
          } else if (data.type === "sessions") {
            const sessions = data.data as WhatsAppSession[];
            
            const updatedSessions: Record<number, WhatsAppSession> = {};
            sessions.forEach(session => {
              updatedSessions[session.profileId] = session;
            });
            
            setSessionUpdates(updatedSessions);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      return socket;
    };
    
    const socket = connectWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user]);
  
  const reconnectProfile = (profileId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "reconnect",
        profileId
      }));
    }
  };

  return {
    isConnected,
    sessionUpdates,
    socket: socketRef.current,
    reconnectProfile
  };
}
