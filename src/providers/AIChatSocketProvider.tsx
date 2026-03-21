"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/store/hooks";
import { connectAISocket, disconnectAISocket } from "@/lib/socket/socket-ai";

type AIChatSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const AIChatSocketContext = createContext<AIChatSocketContextValue | null>(null);

export function AIChatSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectAISocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = connectAISocket(accessToken ?? undefined);
    setSocket(s as Socket);
    setIsConnected(Boolean(s.connected));

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      disconnectAISocket();
    };
  }, [accessToken, isAuthenticated]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected],
  );

  return (
    <AIChatSocketContext.Provider value={value}>
      {children}
    </AIChatSocketContext.Provider>
  );
}

export function useAIChatSocket() {
  const context = useContext(AIChatSocketContext);
  if (!context) {
    throw new Error("useAIChatSocket must be used inside AIChatSocketProvider");
  }

  return context;
}