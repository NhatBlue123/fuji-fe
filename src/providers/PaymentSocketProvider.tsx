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
import { tMsg } from "@/i18n";

import { connectPaymentSocket, disconnectPaymentSocket } from "@/lib/socket/socket-payment";
import { store } from "@/store";
import { useAuth } from "@/store/hooks";
import { baseApi } from "@/store/services/baseApi";

export interface PaymentStatusChangeEvent {
  transactionId?: string;
  userId: number;
  transactionType: "TOPUP" | "PAYOUT";
  orderId?: string;
  withdrawRequestId?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED" | string;
  oldStatus?: string;
  newStatus?: string;
  amount: number;
  walletBalance: number;
  timestamp?: string;
  message?: string;
}

export interface TopupSuccessEvent {
  userId: number;
  orderId: string;
  amount: number;
  walletBalance: number;
  message?: string;
}

type StatusChangeCallback = (data: PaymentStatusChangeEvent) => void;

type PaymentSocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  joinPaymentRoom: (orderId?: string) => void;
  onPaymentStatusChange: (cb: StatusChangeCallback) => () => void;
};

const PaymentSocketContext = createContext<PaymentSocketContextValue | null>(null);
const DUPLICATE_EVENT_WINDOW_MS = 5000;

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
  const recentEventKeys = useRef<Map<string, number>>(new Map());

  const onPaymentStatusChange = useCallback((cb: StatusChangeCallback) => {
    statusChangeCallbacks.current.add(cb);

    return () => {
      statusChangeCallbacks.current.delete(cb);
    };
  }, []);

  const joinPaymentRoom = useCallback((orderId?: string) => {
    if (!user || !socket?.connected) return;

    socket.emit("join-payment-room", { userId: user.id, orderId });
    console.info("[payment] join-payment-room emitted", {
      userId: user.id,
      orderId,
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

    const normalizeTopupSuccess = (data: TopupSuccessEvent): PaymentStatusChangeEvent => ({
      userId: data.userId,
      orderId: data.orderId,
      transactionType: "TOPUP",
      oldStatus: "PENDING",
      newStatus: "SUCCESS",
      status: "SUCCESS",
      amount: data.amount,
      walletBalance: data.walletBalance,
      message: data.message,
    });

    const shouldSkipDuplicateEvent = (data: PaymentStatusChangeEvent) => {
      const eventStatus = data.status || data.newStatus || "UNKNOWN";
      const subjectId =
        data.orderId || data.withdrawRequestId?.toString() || data.transactionId || "global";
      const key = `${data.transactionType}:${subjectId}:${eventStatus}`;
      const now = Date.now();

      recentEventKeys.current.forEach((seenAt, seenKey) => {
        if (now - seenAt > DUPLICATE_EVENT_WINDOW_MS) {
          recentEventKeys.current.delete(seenKey);
        }
      });

      const lastSeenAt = recentEventKeys.current.get(key);
      if (lastSeenAt && now - lastSeenAt <= DUPLICATE_EVENT_WINDOW_MS) {
        return true;
      }

      recentEventKeys.current.set(key, now);
      return false;
    };

    const handlePaymentEvent = (
      data: PaymentStatusChangeEvent,
      eventName: "payment-status-change" | "topup-success",
    ) => {
      console.info(`[payment] ${eventName} received`, {
        ...data,
        receivedAt: new Date().toISOString(),
      });

      if (shouldSkipDuplicateEvent(data)) {
        console.info("[payment] duplicate payment event skipped", {
          eventName,
          transactionType: data.transactionType,
          orderId: data.orderId,
          withdrawRequestId: data.withdrawRequestId,
          status: data.status || data.newStatus,
        });
        return;
      }

      const eventStatus = data.status || data.newStatus;

      // [FRONTEND I18N ROLE] Resolve messageKey ONLY at UI Layer (Toasts)
      if (eventStatus === "SUCCESS") {
        const successMessage =
          data.transactionType === "TOPUP"
            ? tMsg("payment.topupSuccessTitle")
            : tMsg(data.message) || tMsg("payment.status.success");

        toast.success(successMessage);
        if (data.transactionType === "TOPUP" && pathname !== "/premium/success") {
          setTimeout(() => router.push("/premium/success"), 1000);
        }
      } else if (eventStatus === "FAILED") {
        toast.error(tMsg(data.message) || tMsg("payment.status.failed"));
      } else {
        toast.info(tMsg(data.message) || tMsg("payment.status.unknown"));
      }

      store.dispatch(
        baseApi.util.invalidateTags(["Wallet", "Payment", "Withdraw", "Subscription"]),
      );
      statusChangeCallbacks.current.forEach((cb) => cb(data));
    };

    const handlePaymentStatusChange = (data: PaymentStatusChangeEvent) => {
      handlePaymentEvent(data, "payment-status-change");
    };

    const handleTopupSuccess = (data: TopupSuccessEvent) => {
      handlePaymentEvent(normalizeTopupSuccess(data), "topup-success");
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("payment-status-change", handlePaymentStatusChange);
    s.on("topup-success", handleTopupSuccess);

    if (s.connected) {
      queueMicrotask(handleConnect);
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("payment-status-change", handlePaymentStatusChange);
      s.off("topup-success", handleTopupSuccess);
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
