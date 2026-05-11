"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/store/hooks";
import { connectAISocket, disconnectAISocket } from "@/lib/socket/socket-ai";

type AIChatSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  connectionAttempts: number;
};

const AIChatSocketContext = createContext<AIChatSocketContextValue | null>(
  null,
);

export function AIChatSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (!isAuthenticated) {
      disconnectAISocket();
      setSocket(null);
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    const s = connectAISocket(accessToken ?? undefined);
    setSocket(s as Socket);

    // ✅ FIX 1: Không set isConnected ngay, đợi event "connect"
    // setIsConnected(Boolean(s.connected)); // ❌ REMOVED

    const handleConnect = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      setConnectionAttempts(0);
    };

    const handleDisconnect = (reason: string) => {
      if (!mountedRef.current) return;
      setIsConnected(false);

      // ✅ FIX 2: Auto-reconnect on transport errors
      if (
        reason === "transport error" ||
        reason === "transport close" ||
        reason === "ping timeout"
      ) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && s && !s.connected) {
            s.connect();
          }
        }, 2000);
      }
    };

    // ✅ FIX 3: Thêm error handlers
    const handleConnectError = (error: Error) => {
      if (!mountedRef.current) return;
      console.error("[AI Socket] ⚠️ Connection error:", error.message);
      setIsConnected(false);
      setConnectionAttempts((prev) => prev + 1);
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      if (!mountedRef.current) return;
      setConnectionAttempts(attemptNumber);
    };  

    const handleReconnectFailed = () => {
      if (!mountedRef.current) return;
      console.error("[AI Socket] ❌ Reconnection failed after all attempts");
      setIsConnected(false);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);
    s.on("reconnect_attempt", handleReconnectAttempt);
    s.on("reconnect_failed", handleReconnectFailed);

    // ✅ FIX 5: Cleanup listeners properly
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleConnectError);
      s.off("reconnect_attempt", handleReconnectAttempt);
      s.off("reconnect_failed", handleReconnectFailed);
      disconnectAISocket();
    };
  }, [accessToken, isAuthenticated]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      connectionAttempts,
    }),
    [socket, isConnected, connectionAttempts],
  );

  return (
    <AIChatSocketContext.Provider value={value}>
      {children}
    </AIChatSocketContext.Provider>
  );
}

export function useAIChatSocket() {
  const context = useContext(AIChatSocketContext);
  // ✅ Return null values if not in AI Chat context (optional usage)
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      connectionAttempts: 0,
    };
  }

  return context;
}
