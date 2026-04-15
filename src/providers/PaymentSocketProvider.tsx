"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

import { connectPaymentSocket, disconnectPaymentSocket } from "@/lib/socket/socket-payment";
import { store } from "@/store";
import { useAuth } from "@/store/hooks";
import { baseApi } from "@/store/services/baseApi";

export interface PaymentStatusChangeEvent {
  userId: number;
  transactionType: "TOPUP" | "PAYOUT";
  orderId?: string;
  withdrawRequestId?: number;
  oldStatus: string;
  newStatus: string;
  amount: number;
  walletBalance: number;
  message: string;
}

type StatusChangeCallback = (data: PaymentStatusChangeEvent) => void;

type PaymentSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  joinPaymentRoom: () => void;
  onPaymentStatusChange: (cb: StatusChangeCallback) => () => void;
};

const PaymentSocketContext = createContext<PaymentSocketContextValue | null>(null);

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
  const statusChangeCallbacks = useRef<Set<StatusChangeCallback>>(new Set());

  const onPaymentStatusChange = useCallback((cb: StatusChangeCallback) => {
    statusChangeCallbacks.current.add(cb);

    return () => {
      statusChangeCallbacks.current.delete(cb);
    };
  }, []);

  const joinPaymentRoom = useCallback(() => {
    if (!user || !socket?.connected) return;

    socket.emit("join-payment-room", { userId: user.id });
    console.info("[payment] join-payment-room emitted", {
      userId: user.id,
      socketId: socket.id,
      receivedAt: new Date().toISOString(),
    });
  }, [socket, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectPaymentSocket();
      queueMicrotask(() => {
        setSocket(null);
        setIsConnected(false);
      });
      return;
    }

    const s = connectPaymentSocket(accessToken, user.id);

    const handleConnect = () => {
      setSocket(s);
      setIsConnected(true);
      s.emit("join-payment-room", { userId: user.id });
      console.info("[payment] socket connected", {
        userId: user.id,
        socketId: s.id,
        receivedAt: new Date().toISOString(),
      });
      store.dispatch(
        baseApi.util.invalidateTags(["Wallet", "Payment", "Withdraw"]),
      );
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.warn("[payment] socket disconnected", {
        userId: user.id,
        reason,
        receivedAt: new Date().toISOString(),
      });
    };

    const handlePaymentStatusChange = (data: PaymentStatusChangeEvent) => {
      console.info("[payment] payment-status-change received", {
        ...data,
        receivedAt: new Date().toISOString(),
      });

      if (data.newStatus === "SUCCESS") {
        toast.success(data.message || "Giao dịch thành công!");
        if (data.transactionType === "TOPUP" && pathname !== "/premium/success") {
          setTimeout(() => router.push("/premium/success"), 1000);
        }
      } else if (data.newStatus === "FAILED") {
        toast.error(data.message || "Giao dịch thất bại.");
      } else {
        toast.info(data.message || `Trạng thái giao dịch thay đổi: ${data.newStatus}`);
      }

      store.dispatch(
        baseApi.util.invalidateTags(["Wallet", "Payment", "Withdraw", "Subscription"]),
      );
      statusChangeCallbacks.current.forEach((cb) => cb(data));
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("payment-status-change", handlePaymentStatusChange);

    if (s.connected) {
      queueMicrotask(handleConnect);
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("payment-status-change", handlePaymentStatusChange);
      queueMicrotask(() => {
        setSocket((current) => (current === s ? null : current));
      });
      disconnectPaymentSocket();
    };
  }, [accessToken, isAuthenticated, pathname, router, user]);

  const value = useMemo(
    () => ({
      socket: isAuthenticated ? socket : null,
      isConnected: isAuthenticated ? isConnected : false,
      joinPaymentRoom,
      onPaymentStatusChange,
    }),
    [isAuthenticated, isConnected, joinPaymentRoom, onPaymentStatusChange, socket],
  );

  return (
    <PaymentSocketContext.Provider value={value}>
      {children}
    </PaymentSocketContext.Provider>
  );
}

export function usePaymentSocket() {
  const context = useContext(PaymentSocketContext);
  if (!context) {
    throw new Error("usePaymentSocket must be used inside PaymentSocketProvider");
  }

  return context;
}
