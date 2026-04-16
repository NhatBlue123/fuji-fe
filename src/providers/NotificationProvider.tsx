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
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import api from "@/lib/api";
import { 
  connectNotificationSocket, 
  disconnectNotificationSocket,
} from "@/lib/socket/socket-notification";
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

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { accessToken, isAuthenticated, user, isInitialized } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellRingCount, setBellRingCount] = useState(0);
  
  const isMountedRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Phát tiếng chuông khi có thông báo mới
   */
  const playBellSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

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

      console.log("[NotificationProvider] 🔔 Bell sound played!");
    } catch (error) {
      console.error("Failed to play bell sound:", error);
    }
  }, []);

  /**
   * Lấy danh sách thông báo từ Backend API
   */
  const fetchNotifications = useCallback(async () => {
    if (!isInitialized || !isAuthenticated || !accessToken) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.content);
      const count = res.data.content.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(count);
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
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  /**
   * Đánh dấu tất cả là đã đọc
   */
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
      setNotifications(prev => {
        const deleted = prev.find(n => n.id === id);
        if (deleted && !deleted.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!isInitialized || !isAuthenticated || !user) {
      disconnectNotificationSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const handleConnect = () => {
      if (isMountedRef.current) {
        setIsConnected(true);
        console.log("[NotificationProvider] Socket connected, id:", user.id);
      }
    };
    
    const handleDisconnect = () => {
      if (isMountedRef.current) {
        setIsConnected(false);
        console.log("[NotificationProvider] Socket disconnected");
      }
    };
    
    const handleNewNotification = (notification: Notification) => {
      if (!isMountedRef.current) return;
      console.log("[NotificationProvider] 📩 Received new-notification:", notification.title);
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log("[NotificationProvider] 🔔 Unread count:", prev, "->", newCount);
        return newCount;
      });
      
      // Rung chuông + phát tiếng chuông
      setBellRingCount(c => c + 1);
      playBellSound();
    };

    const s = connectNotificationSocket(accessToken, user.id);
    setSocket(s as Socket);

    console.log("[NotificationProvider] Connecting socket with userId:", user.id);

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("new-notification", handleNewNotification);

    fetchNotifications();

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("new-notification", handleNewNotification);
      disconnectNotificationSocket();
      isMountedRef.current = false;
    };
  }, [
    accessToken,
    isInitialized,
    isAuthenticated,
    user,
    fetchNotifications,
    playBellSound,
  ]);

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
    [socket, isConnected, unreadCount, notifications, fetchNotifications, bellRingCount, playBellSound]
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
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
}
