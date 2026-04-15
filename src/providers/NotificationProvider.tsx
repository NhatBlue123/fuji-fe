"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { Socket } from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import api from "@/lib/api";
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
  const pathname = usePathname();
  const { accessToken, isAuthenticated, user, isInitialized } = useAuth();
  const { socket: aiSocket } = useAIChatSocket();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const resetNotificationSocketState = useCallback(() => {
    setSocket(null);
    setIsConnected(false);
  }, []);

  const applyNotificationSocketState = useCallback((nextSocket: Socket) => {
    setSocket(nextSocket);
    setIsConnected(Boolean(nextSocket.connected));
  }, []);

  /**
   * Lấy danh sách thông báo từ Backend API
   */
  const fetchNotifications = useCallback(async () => {
    // Chờ useAuthInit xác thực / refresh JWT — tránh gọi API khi token cookie còn hết hạn
    // nhưng Redux đã hydrate isAuthenticated từ localStorage (401 lần đầu load).
    if (!isInitialized || !isAuthenticated || !accessToken) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.content);
      const count = res.data.content.filter(
        (n: Notification) => !n.isRead,
      ).length;
      setUnreadCount(count);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return;
      }
      console.error("Failed to fetch notifications", error);
    }
  }, [isInitialized, isAuthenticated, accessToken]);

  /**
   * Đánh dấu 1 thông báo là đã đọc
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
   * Đánh dấu tất cả là đã đọc
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
   * Xóa 1 thông báo
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
      toast(notification.title, {
        description: notification.content,
        // Nếu thông báo có đường dẫn liên kết, hiển thị nút "Xem ngay"
        action: notification.linkUrl
          ? {
              label: "Xem ngay",
              onClick: () => {
                markAsRead(notification.id); // Đánh dấu đã đọc khi click
                router.push(notification.linkUrl!); // Chuyển hướng trang
              },
            }
          : undefined,
      });
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
    };
  }, [
    accessToken,
    applyNotificationSocketState,
    resetNotificationSocketState,
    isInitialized,
    isAuthenticated,
    user,
    router,
    fetchNotifications,
  ]);

  useEffect(() => {
    if (!aiSocket || !isAuthenticated || !isInitialized) return;

    const isAiChatPage = pathname?.includes("/ai-chat");

    const onVoiceEvaluationCompleted = (payload: {
      sessionCode?: string;
      feedback?: { feedbackText?: string | null };
    }) => {
      if (isAiChatPage) return;

      toast.success("Sensei đã chấm điểm xong", {
        description:
          payload?.feedback?.feedbackText ||
          (payload?.sessionCode
            ? `Phiên ${payload.sessionCode} đã có nhận xét mới.`
            : "Bạn đã có nhận xét mới từ Sensei."),
        action: {
          label: "Mở AI Chat",
          onClick: () => router.push("/ai-chat"),
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
          label: "Mở AI Chat",
          onClick: () => router.push("/ai-chat"),
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
