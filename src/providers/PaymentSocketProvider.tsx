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
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/store/hooks";
import {
  connectPaymentSocket,
  disconnectPaymentSocket,
} from "@/lib/socket/socket-payment";
import { store } from "@/store";
import { baseApi } from "@/store/services/baseApi";

// ─── Event payload types ────────────────────────────────────
export interface PaymentStatusChangeEvent {
  userId: number;
  transactionType: "TOPUP" | "PAYOUT";
  orderId?: string; // Dành cho nạp tiền
  withdrawRequestId?: number; // Dành cho rút tiền
  oldStatus: string;
  newStatus: string; // VD: 'SUCCESS'
  amount: number;
  walletBalance: number; // Balance mới nhất ở hiện tại
  message: string;
}

// ─── Callback types for component-level listeners ──────────
type StatusChangeCallback = (data: PaymentStatusChangeEvent) => void;

// ─── Context ────────────────────────────────────────────────
type PaymentSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  /** Subscribe to payment-status-change. Returns unsubscribe function. */
  onPaymentStatusChange: (cb: StatusChangeCallback) => () => void;
};

const PaymentSocketContext = createContext<PaymentSocketContextValue | null>(
  null,
);

// ─── Provider ───────────────────────────────────────────────
export function PaymentSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs to hold subscriber Sets (avoids re-renders on subscribe/unsubscribe)
  const statusChangeCallbacks = useRef<Set<StatusChangeCallback>>(new Set());

  // ── Subscribe helpers ──────────────────────────────────────
  const onPaymentStatusChange = useCallback((cb: StatusChangeCallback) => {
    statusChangeCallbacks.current.add(cb);
    return () => {
      statusChangeCallbacks.current.delete(cb);
    };
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
      console.log('Socket reconnected, forcing API sync...');
      setIsConnected(true);
      // Join room bằng userId (dự phòng)
      s.emit("join-payment-room", { userId: user.id });
      // Restore state from API when connection is established (or re-established)
      store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment", "Withdraw"]));
    };
    const handleDisconnect = () => setIsConnected(false);

    // ── Global event handlers ────────────────────────────────
    const handlePaymentStatusChange = (data: PaymentStatusChangeEvent) => {
      console.log('Payment update nhận lập tức:', data);
      // Show toast tùy status
      if (data.newStatus === "SUCCESS") {
        toast.success(data.message || `Giao dịch thành công!`);
        if (data.transactionType === "TOPUP" && pathname !== "/premium/success") {
          setTimeout(() => router.push("/premium/success"), 1000);
        }
      } else if (data.newStatus === "FAILED") {
        toast.error(data.message || `Giao dịch thất bại.`);
      } else {
        toast.info(data.message || `Trạng thái giao dịch thay đổi: ${data.newStatus}`);
      }
      
      store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment", "Withdraw", "Subscription"]));
      statusChangeCallbacks.current.forEach((cb) => cb(data));
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("payment-status-change", handlePaymentStatusChange);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("payment-status-change", handlePaymentStatusChange);
      disconnectPaymentSocket();
    };
  }, [accessToken, isAuthenticated, user]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      onPaymentStatusChange,
    }),
    [
      socket,
      isConnected,
      onPaymentStatusChange,
    ],
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
    throw new Error(
      "usePaymentSocket must be used inside PaymentSocketProvider",
    );
  }
  return context;
}
