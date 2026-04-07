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

// Map pathname → breadcrumb label
const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/analytics": "Thống kê",
  "/admin/users": "Người dùng",
  "/admin/courses": "Khóa học",
  "/admin/courses/finance": "Tài chính khóa học (Admin)",
  "/admin/courses/finance/teacher": "Tài chính khóa học (Giáo viên)",
  "/admin/teacher-schedules": "Lịch dạy",
  "/admin/teacher-schedules/teaching-schedule": "Lịch dạy giáo viên",
  "/admin/teacher-schedules/create-slot": "Tạo lịch dạy",
  "/admin/flashcard": "Flashcard",
  "/admin/posts": "Bài viết",
  "/admin/jlpt-tests": "Đề thi JLPT",
  "/admin/notifications": "Thông báo",
  "/admin/roles": "Phân quyền",
  "/admin/settings": "Cài đặt",
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
      toast.success("Đăng xuất thành công!");
      router.push("/");
    } catch {
      toast.error("Đăng xuất thất bại");
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
          className="relative h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-destructive" />
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
                Hồ sơ của tôi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
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
