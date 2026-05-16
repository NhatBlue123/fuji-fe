"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getStompClient,
  getStompConnectionState,
  subscribeStomp,
  subscribeStompConnectionState,
  type StompConnectionState,
} from "@/lib/stomp";

interface StompContextValue {
  connectionState: StompConnectionState;
  isConnected: boolean;
  reconnect: () => void;
}

const StompContext = createContext<StompContextValue | null>(null);

interface StompProviderProps {
  children: React.ReactNode;
  token: string | null;
  /** Lesson ID is used as a signal to ensure the provider is active during lesson flow. */
  lessonId?: number | null;
}

/**
 * Provides global STOMP connection state to the React tree.
 *
 * Usage:
 * ```tsx
 * // Wrap your app or lesson layout with the provider
 * <StompProvider token={token} lessonId={bookingId}>
 *   {children}
 * </StompProvider>
 *
 * // Or use the hook in any component within the provider
 * const { connectionState, isConnected, reconnect } = useStompContext();
 * ```
 */
export function StompProvider({ children, token }: StompProviderProps) {
  const [connectionState, setConnectionState] = useState<StompConnectionState>(
    getStompConnectionState()
  );
  const tokenRef = useRef<string | null>(token);

  useEffect(() => {
    const unsubscribe = subscribeStompConnectionState((state) => {
      setConnectionState(state);
    });

    // If a token is provided and STOMP is not connected, bootstrap the connection.
    if (token) {
      tokenRef.current = token;
      getStompClient(token);
    }

    return unsubscribe;
  }, [token]);

  const reconnect = useCallback(() => {
    if (tokenRef.current) {
      getStompClient(tokenRef.current);
    }
  }, []);

  return (
    <StompContext.Provider
      value={{
        connectionState,
        isConnected: connectionState === "CONNECTED",
        reconnect,
      }}
    >
      {children}
    </StompContext.Provider>
  );
}

/**
 * Access the global STOMP connection state.
 * Must be used within a `<StompProvider>` tree.
 */
export function useStompContext(): StompContextValue {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error("useStompContext must be used within a <StompProvider>");
  }
  return ctx;
}

/**
 * Lightweight hook that subscribes to STOMP topic with automatic
 * re-subscription after STOMP reconnection.
 *
 * Returns an unsubscribe function (same signature as `subscribeStomp`).
 *
 * Usage:
 * ```tsx
 * const unsubscribe = useStompSubscribe(
 *   token,
 *   `/topic/room/${lessonId}/chat`,
 *   (frame) => { /* handle message *\/ }
 * );
 * // cleanup on unmount:
 * useEffect(() => unsubscribe, [unsubscribe]);
 * ```
 */
export function useStompSubscribe(
  token: string | null,
  destination: string,
  callback: Parameters<typeof subscribeStomp>[2]
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const latestCallback = useCallback(
    (frame: Parameters<Parameters<typeof subscribeStomp>[2]>[0]) => {
      callbackRef.current(frame);
    },
    []
  );

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const destRef = useRef(destination);

  useEffect(() => {
    if (!token || !destination) return;

    destRef.current = destination;
    unsubscribeRef.current = subscribeStomp(token, destination, latestCallback);

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [token, destination, latestCallback]);

  // Re-subscribe if connection becomes CONNECTED after being disconnected
  useEffect(() => {
    const unsubscribe = subscribeStompConnectionState((state) => {
      if (state === "CONNECTED" && token && destRef.current && unsubscribeRef.current === null) {
        unsubscribeRef.current = subscribeStomp(token, destRef.current, latestCallback);
      }
    });

    return unsubscribe;
  }, [token, latestCallback]);

  return useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);
}
