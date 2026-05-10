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
import axios from "axios";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import api from "@/lib/api";
import { tMsg } from "@/i18n";
import { useTranslation } from "react-i18next";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from "@/lib/socket/socket-notification";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import { Notification } from "@/types/notification";

type NotificationContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  bellRingCount: number;
  playBellSound: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { accessToken, isAuthenticated, user, isInitialized } = useAuth();
  const { socket: aiSocket } = useAIChatSocket();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellRingCount, setBellRingCount] = useState(0);
  
  const isMountedRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  const resetNotificationSocketState = useCallback(() => {
    setSocket(null);
    setIsConnected(false);
  }, []);

  const applyNotificationSocketState = useCallback((nextSocket: Socket) => {
    setSocket(nextSocket);
    setIsConnected(Boolean(nextSocket.connected));
  }, []);

  /**
   * Phát tiếng chuông khi có thông báo mới
   */
  const playBellSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      // Resume AudioContext nếu nó bị suspended (Chrome autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
          // Ignore errors - audio might still not be allowed
        });
      }

      // Trì hoãn phát tiếng chuông một chút để đợi AudioContext resume
      const playChime = () => {
        const frequencies = [2093, 2637, 3136];
        const durations = [0.15, 0.15, 0.3];
        const delays = [0, 0.15, 0.3];

        frequencies.forEach((freq, i) => {
          const startTime = ctx.currentTime + delays[i];
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(freq, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + durations[i]);

          oscillator.start(startTime);
          oscillator.stop(startTime + durations[i]);
        });
      };

      if (ctx.state === "running") {
        playChime();
      } else {
        // Đợi một chút rồi thử lại
        setTimeout(() => {
          if (ctx.state === "running") {
            playChime();
          }
        }, 100);
      }

    } catch (error) {
      console.error("Failed to play bell sound:", error);
    }
  }, []);

  /**
   * Lấy danh sách thông báo từ Backend API (kèm unreadCount từ API)
   */
  const fetchNotifications = useCallback(async () => {
    if (!isInitialized || !isAuthenticated || !accessToken) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.content);
      // Lấy unreadCount trực tiếp từ response của API (count từ DB, chính xác)
      if (res.data.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return;
      }
      console.error("Failed to fetch notifications", error);
    }
  }, [isInitialized, isAuthenticated, accessToken]);

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  /**
   * Đánh dấu tất cả là đã đọc
   */
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  /**
   * Xóa 1 thông báo
   */
  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === id);
        if (deleted && !deleted.isRead)
          setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!isInitialized || !isAuthenticated || !user) {
      disconnectNotificationSocket();
      queueMicrotask(resetNotificationSocketState);
      return;
    }

    const s = connectNotificationSocket(accessToken, user.id);
    queueMicrotask(() => applyNotificationSocketState(s as Socket));

    // Xử lý sự kiện kết nối thành công
    const handleConnect = () => setIsConnected(true);
    // Xử lý sự kiện mất kết nối
    const handleDisconnect = () => setIsConnected(false);

    // Xử lý khi nhận được thông báo mới từ server qua socket
    const handleNewNotification = (notification: Notification) => {
      // Cập nhật danh sách thông báo hiện tại (thêm vào đầu mảng)
      setNotifications((prev) => [notification, ...prev]);
      // Tăng số lượng thông báo chưa đọc
      setUnreadCount((prev) => prev + 1);

      // Hiển thị thông báo dạng Popup (Toast) ngay lập tức
      toast(tMsg(notification.title), {
        description: tMsg(notification.content),
        // Nếu thông báo có đường dẫn liên kết, hiển thị nút "Học ngay"
        action: notification.linkUrl
          ? {
              label: t("common.viewNow"),
              onClick: () => {
                markAsRead(notification.id); // Đánh dấu đã đọc khi click
                router.push(notification.linkUrl!); // Chuyển hướng trang
              },
            }
          : undefined,
      });
      
      // Rung chuông + phát tiếng chuông
      setBellRingCount(c => c + 1);
      playBellSound();
    };
    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("new-notification", handleNewNotification);

    void Promise.resolve().then(() => fetchNotifications());

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("new-notification", handleNewNotification);
      disconnectNotificationSocket();
      isMountedRef.current = false;
    };
  }, [
    accessToken,
    applyNotificationSocketState,
    resetNotificationSocketState,
    isInitialized,
    isAuthenticated,
    user,
    fetchNotifications,
    playBellSound,
  ]);

  useEffect(() => {
    if (!aiSocket || !isAuthenticated || !isInitialized) return;

    const isAiChatPage = pathname?.includes("/ai-chat") || pathname?.includes("/sensei");

    const onVoiceEvaluationCompleted = (payload: {
      sessionCode?: string;
      feedback?: { feedbackText?: string | null };
    }) => {
      if (isAiChatPage) return;

      toast.success(tMsg("ai.evaluationCompleted") || "Sensei đã chấm điểm xong", {
        description:
          tMsg(payload?.feedback?.feedbackText) ||
          (payload?.sessionCode
            ? tMsg("ai.sessionHasNewFeedback", { code: payload.sessionCode }) || `Phiên ${payload.sessionCode} đã có nhận xét mới.`
            : tMsg("ai.genericFeedbackReceived") || "Bạn đã có nhận xét mới từ Sensei."),
        action: {
          label: tMsg("ai.openSensei") || "Mở AI Sensei",
          onClick: () => router.push("/sensei"),
        },
      });
    };

    const onVoiceEvaluationFailed = (payload: {
      error?: string;
      sessionCode?: string;
    }) => {
      if (isAiChatPage) return;

      toast.error(payload?.error || "Không thể chấm điểm phiên hội thoại", {
        description: payload?.sessionCode
          ? `Phiên ${payload.sessionCode}`
          : undefined,
        action: {
          label: "Mở AI Sensei",
          onClick: () => router.push("/sensei"),
        },
      });
    };

    aiSocket.on("voice:evaluation:completed", onVoiceEvaluationCompleted);
    aiSocket.on("voice:evaluation:failed", onVoiceEvaluationFailed);

    return () => {
      aiSocket.off("voice:evaluation:completed", onVoiceEvaluationCompleted);
      aiSocket.off("voice:evaluation:failed", onVoiceEvaluationFailed);
    };
  }, [aiSocket, isAuthenticated, isInitialized, pathname, router]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      unreadCount,
      notifications,
      setNotifications,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      bellRingCount,
      playBellSound,
    }),
    [socket, isConnected, unreadCount, notifications, fetchNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
