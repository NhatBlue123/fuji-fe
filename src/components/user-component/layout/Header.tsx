"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Sparkles,
  Flame,
} from "lucide-react";
import { useTheme } from "@/components/common";
import { useAuth, useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { useNotifications } from "@/providers/NotificationProvider";
import { useGetWalletQuery } from "@/store/services/walletApi";
import { useGetStreakQuery } from "@/store/services/progressApi";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { TooltipProvider } from "@/components/ui/tooltip";

function HeaderAuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <div className="hidden h-10 w-20 animate-pulse rounded-full bg-muted/70 sm:block" />
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted/70" />
      <div className="h-10 w-[156px] animate-pulse rounded-xl bg-muted/70" />
    </div>
  );
}

const Header = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, roles } = useAuth();
  const { unreadCount, notifications, markAsRead, bellRingCount } = useNotifications();
  const [bellAnimating, setBellAnimating] = useState(false);
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

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

        if (currentScrollTop <= threshold || delta < -4) {
          setIsHeaderHidden(false);
        } else if (delta > 4 && currentScrollTop > threshold) {
          setIsHeaderHidden(true);
        }

        lastScrollTop = currentScrollTop;
        ticking = false;
      });
    };

    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(rafId);
    };
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

  const getRoleLabel = () => {
    if (!roles) return t("common.roles.student");
    if (roles.includes("ADMIN") || roles.includes("ROLE_ADMIN"))
      return t("common.roles.admin");
    if (roles.includes("INSTRUCTOR") || roles.includes("ROLE_INSTRUCTOR"))
      return t("common.roles.instructor");
    return t("common.roles.student");
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success(t("sidebar.logoutSuccess") || "Đăng xuất thành công!");
      router.push("/");
    } catch {
      toast.error(t("sidebar.logoutFailed") || "Đăng xuất thất bại");
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header
        data-app-header
        className={cn(
          "sticky top-0 z-50 h-16 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300 ease-out hidden md:flex items-center justify-between px-4 md:px-4 lg:px-6 pr-3 md:pr-3 lg:pr-4 will-change-transform",
          isHeaderHidden
            ? "-mt-16 -translate-y-full opacity-0 pointer-events-none"
            : "mt-0 translate-y-0 opacity-100"
        )}
      >
        <div className="flex items-center gap-4"></div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Streak Indicator */}
          {canShowAuthUi && streak && streak.streakCount > 0 && (
            <div
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold",
                "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30",
                "text-orange-400"
              )}
            >
              <Flame className="size-4 text-orange-500 animate-pulse" />
              <span>{streak.streakCount}</span>
              <span className="text-xs text-orange-400/70 hidden sm:inline">ngày</span>
            </div>
          )}

          {canShowAuthUi && (
            <Link
              href="/profile/wallet"
              className="flex h-10 items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-3 text-secondary transition-colors hover:bg-secondary/10"
              title={t('auto.header_9')}
            >
              <span className="text-xs font-bold leading-none">
                {flowerBalance.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")} 🌸
              </span>
            </Link>
          )}

          {/* ICON 1: LANGUAGE */}
          <LanguageSwitcher
            hideLabel
            className="h-10 w-10 bg-transparent border-none hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-secondary transition-all active:scale-90 active:translate-y-[1px] flex items-center justify-center p-0"
          />

          {/* ICON 2: THEME */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-secondary transition-all active:scale-90 active:translate-y-[1px]"
          >
            <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {!mounted && <HeaderAuthSkeleton />}

          {/* ICON 3: NOTIFICATION  */}
          {canShowAuthUi && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-secondary transition-all active:scale-90 active:translate-y-[1px]",
                    bellAnimating && "animate-bell-shake"
                  )}
                >
                  <Bell className={cn("size-5", bellAnimating && "animate-bell-ring")} />
                  {unreadCount > 0 && (
                    <Badge className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary p-0 text-[8px] font-bold text-white border-2 border-background">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[340px] p-0 mr-4 shadow-2xl rounded-2xl border border-secondary/10 overflow-hidden bg-popover text-popover-foreground"
                align="end"
              >
                <div className="flex items-center justify-between border-b border-secondary/20 px-5 py-4 bg-secondary/5">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-secondary" />
                    <h4 className="text-xs font-bold tracking-widest uppercase text-secondary font-sans">
                      {t("common.notification") || "Thông báo"}
                    </h4>
                  </div>
                  <Link
                    href="/notifications"
                    className="text-[10px] font-bold text-secondary hover:underline uppercase font-sans"
                  >
                    {t("common.viewAll") || "Xem tất cả"}
                  </Link>
                </div>
                <ScrollArea className="h-[400px]">
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
                            "flex items-start gap-3 border-b px-5 py-4 text-left transition-all hover:bg-muted/50 group relative",
                            !n.isRead
                              ? "bg-secondary/[0.06] dark:bg-secondary/[0.08] border-l-[4px] border-l-secondary"
                              : "opacity-60 border-l-[4px] border-l-transparent",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={cn(
                                  "text-[13px] font-black truncate font-sans tracking-tight",
                                  !n.isRead
                                    ? "text-secondary"
                                    : "text-foreground/40",
                                )}
                              >
                                {t("common.notification")}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "line-clamp-2 text-xs leading-relaxed font-sans font-bold",
                                !n.isRead
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50",
                              )}
                            >
                              {n.content}
                            </p>
                            <span className="text-[9px] text-muted-foreground/40 font-bold mt-1 block">
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
                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-30">
                      <Bell className="size-8 mb-2 text-secondary" />
                      <p className="text-[10px] font-bold uppercase tracking-widest font-sans">
                        {t("common.noNotifications") || "Không có thông báo mới"}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {mounted && isAuthenticated && (
            <div className="h-6 w-[1px] bg-border mx-1 opacity-50" />
          )}

          {/* ACCOUNT DROPDOWN (Chỉ hiện khi đã đăng nhập) */}
          {canShowAuthUi && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 px-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-xl active:scale-95 active:translate-y-[1px] group"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-secondary/30 transition-all ring-offset-background">
                    <AvatarImage
                      src={
                        user?.avatar ||
                        user?.avatarUrl ||
                        "/images/avt-default.jpg"
                      }
                    />
                    <AvatarFallback className="bg-secondary text-white font-sans">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start px-2 text-left md:flex w-[120px]">
                    <span className="text-[13px] font-bold leading-none truncate w-full tracking-tight group-hover:text-secondary transition-colors font-sans">
                      {user?.fullname || user?.fullName || user?.username}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground mt-1 tracking-widest opacity-60 font-sans truncate w-full">
                      {getRoleLabel()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 p-2 rounded-2xl shadow-2xl border border-secondary/10 bg-popover text-popover-foreground"
                align="end"
              >
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 border border-border pb-1">
                    <AvatarImage
                      src={
                        user?.avatar ||
                        user?.avatarUrl ||
                        "/images/avt-default.jpg"
                      }
                    />
                    <AvatarFallback className="bg-secondary text-white font-sans">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold truncate font-sans">
                      {user?.fullname || user?.fullName || user?.username}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground truncate font-sans">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="opacity-50" />
                <div className="px-1 py-1 space-y-0.5">
                  <DropdownMenuItem
                    asChild
                    className="rounded-xl cursor-pointer py-3 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 transition-colors"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 w-full"
                    >
                      <User className="size-4 text-secondary" />
                      <span className="text-sm font-medium font-sans text-slate-700 dark:text-slate-200">
                        {t("common.profile") || "Hồ sơ cá nhân"}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="rounded-xl cursor-pointer py-3 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 transition-colors"
                  >
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 w-full"
                    >
                      <Settings className="size-4 text-secondary" />
                      <span className="text-sm font-medium font-sans text-slate-700 dark:text-slate-200">{t('auto.header_1')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/premium")}
                    className="rounded-xl cursor-pointer py-3 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full text-secondary">
                      <Sparkles className="size-4" />
                      <span className="text-xs font-bold uppercase tracking-tight font-sans">
                        FUJI Premium High-end
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-slate-600 dark:text-slate-400 hover:text-red-500 focus:text-red-500 dark:hover:text-red-400 dark:focus:text-red-400 rounded-xl cursor-pointer py-3 font-bold uppercase text-[10px] tracking-widest mt-1 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10 transition-all font-sans"
                >
                  <LogOut className="mr-3 size-4" />
                  <span>{t("sidebar.logout") || "Đăng xuất"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {mounted && !isAuthenticated && (
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="text-xs font-bold text-secondary uppercase tracking-widest px-6 h-10 hover:bg-secondary/10 transition-all rounded-xl active:scale-95"
            >{t('auto.header_2')}</Button>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
