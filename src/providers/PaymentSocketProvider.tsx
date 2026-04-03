"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";

import { useAuth } from "@/store/hooks";
import {
  connectPaymentSocket,
  disconnectPaymentSocket,
} from "@/lib/socket/socket-payment";
import { store } from "@/store";
import { baseApi } from "@/store/services/baseApi";

// ─── Event payload types ────────────────────────────────────
export interface TopupSuccessPayload {
  userId: number;
  orderId: string;
  amount: number;
  walletBalance: number;
  message: string;
}

export interface PayoutSuccessPayload {
  userId: number;
  withdrawRequestId: number;
  amount: number;
  walletBalance: number;
  message: string;
}

export interface PaymentStatusChangePayload {
  userId: number;
  orderId: string;
  oldStatus: string;
  newStatus: string;
  amount: number;
  message: string;
}

// ─── Callback types for component-level listeners ──────────
type TopupCallback = (data: TopupSuccessPayload) => void;
type PayoutCallback = (data: PayoutSuccessPayload) => void;
type StatusChangeCallback = (data: PaymentStatusChangePayload) => void;

// ─── Context ────────────────────────────────────────────────
type PaymentSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  /** Subscribe to topup-success. Returns unsubscribe function. */
  onTopupSuccess: (cb: TopupCallback) => () => void;
  /** Subscribe to payout-success. Returns unsubscribe function. */
  onPayoutSuccess: (cb: PayoutCallback) => () => void;
  /** Subscribe to payment-status-change. Returns unsubscribe function. */
  onPaymentStatusChange: (cb: StatusChangeCallback) => () => void;
};

const PaymentSocketContext = createContext<PaymentSocketContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────
export function PaymentSocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs to hold subscriber Sets (avoids re-renders on subscribe/unsubscribe)
  const topupCallbacks = useRef<Set<TopupCallback>>(new Set());
  const payoutCallbacks = useRef<Set<PayoutCallback>>(new Set());
  const statusChangeCallbacks = useRef<Set<StatusChangeCallback>>(new Set());

  // ── Subscribe helpers ──────────────────────────────────────
  const onTopupSuccess = useCallback((cb: TopupCallback) => {
    topupCallbacks.current.add(cb);
    return () => { topupCallbacks.current.delete(cb); };
  }, []);

  const onPayoutSuccess = useCallback((cb: PayoutCallback) => {
    payoutCallbacks.current.add(cb);
    return () => { payoutCallbacks.current.delete(cb); };
  }, []);

  const onPaymentStatusChange = useCallback((cb: StatusChangeCallback) => {
    statusChangeCallbacks.current.add(cb);
    return () => { statusChangeCallbacks.current.delete(cb); };
  }, []);

  // ── Socket lifecycle ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectPaymentSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = connectPaymentSocket(accessToken, user.id);
    setSocket(s as Socket);
    setIsConnected(Boolean(s.connected));

    const handleConnect = () => {
      setIsConnected(true);
      // Join room bằng userId (dự phòng)
      s.emit("join-payment-room", { userId: user.id });
    };
    const handleDisconnect = () => setIsConnected(false);

    // ── Global event handlers ────────────────────────────────
    const handleTopupSuccess = (data: TopupSuccessPayload) => {
      toast.success(data.message || "Nạp tiền thành công!");
      // Invalidate RTK Query cache → wallet & history tự refresh
      store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment"]));
      // Notify all component-level subscribers
      topupCallbacks.current.forEach((cb) => cb(data));
    };

    const handlePayoutSuccess = (data: PayoutSuccessPayload) => {
      toast.success(data.message || "Rút tiền thành công!");
      store.dispatch(baseApi.util.invalidateTags(["Wallet", "Withdraw"]));
      payoutCallbacks.current.forEach((cb) => cb(data));
    };

    const handlePaymentStatusChange = (data: PaymentStatusChangePayload) => {
      // Show toast tùy status
      if (data.newStatus === "SUCCESS") {
        toast.success(data.message || `Giao dịch ${data.orderId} thành công!`);
      } else if (data.newStatus === "FAILED") {
        toast.error(data.message || `Giao dịch ${data.orderId} thất bại.`);
      } else {
        toast.info(data.message || `Giao dịch ${data.orderId}: ${data.newStatus}`);
      }
      store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment"]));
      statusChangeCallbacks.current.forEach((cb) => cb(data));
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("topup-success", handleTopupSuccess);
    s.on("payout-success", handlePayoutSuccess);
    s.on("payment-status-change", handlePaymentStatusChange);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("topup-success", handleTopupSuccess);
      s.off("payout-success", handlePayoutSuccess);
      s.off("payment-status-change", handlePaymentStatusChange);
      disconnectPaymentSocket();
    };
  }, [accessToken, isAuthenticated, user]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      onTopupSuccess,
      onPayoutSuccess,
      onPaymentStatusChange,
    }),
    [socket, isConnected, onTopupSuccess, onPayoutSuccess, onPaymentStatusChange]
  );

  return (
    <PaymentSocketContext.Provider value={value}>
      {children}
    </PaymentSocketContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────
export function usePaymentSocket() {
  const context = useContext(PaymentSocketContext);
  if (!context) {
    throw new Error("usePaymentSocket must be used inside PaymentSocketProvider");
  }
  return context;
}
