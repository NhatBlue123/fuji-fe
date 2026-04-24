"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { useTheme } from "@/components/common/ThemeProvider";
import { toast } from "sonner";
import { Bell, LogOut, Sun, Moon, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/providers/NotificationProvider";
import { useTranslation } from "react-i18next";



export function AdminHeader() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const { unreadCount, bellRingCount } = useNotifications();
  const [bellAnimating, setBellAnimating] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const pageTitles: Record<string, string> = React.useMemo(() => ({
    "/admin": "Dashboard",
    "/admin/analytics": t("admin.sidebar.items.analytics"),
    "/admin/users": t("admin.sidebar.items.users"),
    "/admin/courses": t("admin.sidebar.items.courses"),
    "/admin/courses/finance": t("admin.sidebar.items.coursesFinanceAdmin"),
    "/admin/courses/finance/teacher": t("admin.sidebar.items.coursesFinanceTeacher"),
    "/admin/teacher-schedules": t("admin.sidebar.items.schedules"),
    "/admin/teacher-schedules/teaching-schedule": t("admin.sidebar.items.schedules"),
    "/admin/teacher-schedules/create-slot": t("booking.createTitle"),
    "/admin/flashcard": t("common.flashcard"),
    "/admin/posts": t("admin.sidebar.items.posts"),
    "/admin/jlpt-tests": t("admin.sidebar.items.tests"),
    "/admin/notifications": t("admin.sidebar.items.notifications"),
    "/admin/roles": t("admin.sidebar.items.roles"),
    "/admin/settings": t("common.settings"),
  }), [t, i18n.language]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (bellRingCount > 0) {
      setBellAnimating(true);
      const timer = setTimeout(() => setBellAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [bellRingCount]);

  const pageTitle =
    pageTitles[pathname] ??
    (pathname.split("/").pop()?.replace(/-/g, " ") || "Admin");

  const displayName =
    user?.fullname || user?.fullName || user?.username || "Admin";
  const avatarSrc =
    user?.avatar || user?.avatarUrl || "/images/avt-default.jpg";
  const email = user?.email || "";

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success(t("auth.logoutSuccess"));
      router.push("/");
    } catch {
      toast.error(t("auth.logoutFailed"));
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-6 shrink-0">
      {/* Page title / breadcrumb */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-sidebar-foreground capitalize">
          {pageTitle}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-8 w-8 text-muted-foreground hover:text-sidebar-foreground transition-all",
            bellAnimating && "animate-bell-shake"
          )}
        >
          <Bell className={cn("h-4 w-4", bellAnimating && "animate-bell-ring")} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-secondary" />
          )}
        </Button>

        {/* User dropdown */}
        {isAuthenticated && mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent focus:outline-none">
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    fill
                    sizes="28px"
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/avt-default.jpg";
                    }}
                  />
                </div>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="max-w-[120px] truncate text-xs font-semibold text-sidebar-foreground">
                    {displayName}
                  </span>
                  {email && (
                    <span className="max-w-[120px] truncate text-[10px] text-muted-foreground">
                      {email}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{displayName}</p>
                  {email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                {t("common.myProfile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Skeleton khi chưa mount hoặc chưa đăng nhập
          <div className="flex items-center gap-2 rounded-lg px-2 py-1">
            <div className="h-7 w-7 animate-pulse rounded-full bg-sidebar-accent" />
            <div className="hidden sm:flex flex-col gap-1">
              <div className="h-2.5 w-20 animate-pulse rounded bg-sidebar-accent" />
              <div className="h-2 w-28 animate-pulse rounded bg-sidebar-accent" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
