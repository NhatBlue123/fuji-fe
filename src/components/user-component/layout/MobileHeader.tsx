"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Flame,
} from "lucide-react";
import { useTheme } from "@/components/common";
import { useAuth, useAppDispatch } from "@/store/hooks";
import { useNotifications } from "@/providers/NotificationProvider";
import { useGetWalletQuery } from "@/store/services/walletApi";
import { useGetStreakQuery } from "@/store/services/progressApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const MobileHeader = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount, notifications, markAsRead, bellRingCount } = useNotifications();
  const [bellAnimating, setBellAnimating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    if (bellRingCount > 0) {
      const startTimer = window.setTimeout(() => setBellAnimating(true), 0);
      const timer = setTimeout(() => setBellAnimating(false), 1000);
      return () => {
        window.clearTimeout(startTimer);
        clearTimeout(timer);
      };
    }
  }, [bellRingCount]);

  useEffect(() => {
    const scrollRoot = document.querySelector<HTMLElement>("[data-app-main]");
    if (!scrollRoot) return;

    let lastScrollTop = scrollRoot.scrollTop;
    let ticking = false;
    let rafId = 0;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        const currentScrollTop = scrollRoot.scrollTop;
        const threshold = 80;
        const delta = currentScrollTop - lastScrollTop;

        setIsScrolled(currentScrollTop > 10);

        if (currentScrollTop <= threshold || delta < -4) {
          setIsHeaderHidden(false);
        } else if (delta > 4 && currentScrollTop > threshold) {
          setIsHeaderHidden(true);
        }

        lastScrollTop = currentScrollTop;
        ticking = false;
      });
    };

    handleScroll();
    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const canShowAuthUi = mounted && isAuthenticated;
  const { data: wallet } = useGetWalletQuery(undefined, {
    skip: !canShowAuthUi,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const flowerBalance = wallet?.balance ?? 0;

  const { data: streak } = useGetStreakQuery(undefined, {
    skip: !canShowAuthUi,
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isHeaderHidden ? "-100%" : 0, opacity: isHeaderHidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "md:hidden sticky top-0 z-50 w-full transition-all duration-300 will-change-transform",
        isHeaderHidden && "-mt-[57px] pointer-events-none",
        isScrolled 
          ? "bg-background/98 backdrop-blur-xl shadow-lg border-b border-border/50" 
          : "bg-background/80 backdrop-blur-md border-b border-border/30"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <div className="relative w-8 h-6">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg blur-sm opacity-0 group-hover:opacity-50 transition-opacity" />
              <img 
                src="/images/logofuji_v1.png" 
                alt="FUJI Logo" 
                className="relative z-10 w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
              FUJI
            </span>
          </motion.div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Streak */}
          {canShowAuthUi && streak && streak.currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold",
                "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30",
                "text-orange-400"
              )}
            >
              <Flame className="size-3.5 text-orange-500 animate-pulse" />
              <span>{streak.currentStreak}</span>
            </motion.div>
          )}

          {/* Wallet */}
          {canShowAuthUi && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
            >
              <Link
                href="/profile/wallet"
                className="flex h-9 items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/5 px-2.5 text-secondary transition-all hover:bg-secondary/10 active:scale-95"
              >
                <span className="text-xs font-bold leading-none">
                  {flowerBalance.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}
                </span>
                <span className="text-sm">🌸</span>
              </Link>
            </motion.div>
          )}

          {/* Theme Toggle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full hover:bg-muted transition-all active:scale-90"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </motion.div>

          {/* Notifications */}
          {canShowAuthUi && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 relative rounded-full hover:bg-muted transition-all active:scale-90",
                      bellAnimating && "animate-bell-shake"
                    )}
                  >
                    <Bell className={cn("size-4", bellAnimating && "animate-bell-ring")} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary p-0 text-[9px] font-bold text-white border-2 border-background">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[90vw] max-w-[340px] p-0 mr-2 shadow-2xl rounded-2xl border border-secondary/10 overflow-hidden"
                  align="end"
                >
                  <div className="flex items-center justify-between border-b border-secondary/20 px-4 py-3 bg-secondary/5">
                    <div className="flex items-center gap-2">
                      <Bell className="size-3.5 text-secondary" />
                      <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">
                        {t("common.notification") || "Thông báo"}
                      </h4>
                    </div>
                    <Link
                      href="/notifications"
                      className="text-[10px] font-bold text-secondary hover:underline uppercase"
                    >
                      {t("common.viewAll") || "Xem tất cả"}
                    </Link>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                      <div className="flex flex-col">
                        {notifications.slice(0, 10).map((n) => {
                          const notificationKey = typeof n.id === 'string' ? `str-${n.id}` : `num-${n.id}`;
                          return (
                            <button
                              key={notificationKey}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.linkUrl) router.push(n.linkUrl);
                              }}
                              className={cn(
                                "flex items-start gap-3 border-b px-4 py-3 text-left transition-all hover:bg-muted/50 group relative",
                                !n.isRead
                                  ? "bg-secondary/[0.06] dark:bg-secondary/[0.08] border-l-[3px] border-l-secondary"
                                  : "opacity-60 border-l-[3px] border-l-transparent",
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "line-clamp-2 text-xs leading-relaxed font-semibold",
                                    !n.isRead
                                      ? "text-foreground"
                                      : "text-muted-foreground/50",
                                  )}
                                >
                                  {n.content}
                                </p>
                                <span className="text-[9px] text-muted-foreground/40 font-medium mt-1 block">
                                  {formatDistanceToNow(new Date(n.createdAt), {
                                    addSuffix: true,
                                    locale: i18n.language === "vi" ? vi : i18n.language === "ja" ? ja : enUS,
                                  })}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                        <Bell className="size-8 mb-2 text-secondary" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          {t("common.noNotifications") || "Không có thông báo mới"}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress Bar on Scroll */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 origin-left"
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default MobileHeader;
