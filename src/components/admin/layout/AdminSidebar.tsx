"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  FileText,
  Bell,
  Shield,
  BookOpenCheck,
  Sun,
  Moon,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeProvider";
import { useAuth, useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Thống kê",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Quản lý",
    items: [
      {
        title: "Người dùng",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Khóa học",
        href: "/admin/courses",
        icon: BookOpen,
      },
      {
        title: "Flashcard",
        href: "/admin/flashcard",
        icon: Layers,
      },
      {
        title: "Bài viết",
        href: "/admin/posts",
        icon: FileText,
      },
      {
        title: "Đề thi",
        href: "/admin/jlpt-tests",
        icon: BookOpenCheck
      }
    ],
  },
  {
    label: "Hệ thống",
    items: [
      {
        title: "Thông báo",
        href: "/admin/notifications",
        icon: Bell,
        badge: "3",
      },
      {
        title: "Phân quyền",
        href: "/admin/roles",
        icon: Shield,
      },
      {
        title: "Cài đặt",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = user?.fullname || user?.fullName || user?.username || "Admin";
  const avatarSrc = user?.avatar || user?.avatarUrl || "/images/avt-default.jpg";

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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            F
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
              FUJI Admin
            </span>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                {!collapsed && (
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                )}
                {collapsed && <Separator className="mb-2 bg-sidebar-border" />}
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          <p>{item.title}</p>
                          {item.badge && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({item.badge})
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <React.Fragment key={item.href}>
                      {linkContent}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Bottom Actions */}
        <div className="p-3 flex flex-col gap-1">
          {/* Theme toggle */}
          {mounted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 shrink-0" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0" />
                  )}
                  {!collapsed && <span>Giao diện {theme === "dark" ? "sáng" : "tối"}</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>Đổi giao diện</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          <Separator className="bg-sidebar-border my-1" />

          {/* User info + logout */}
          {mounted && isAuthenticated && user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors cursor-default",
                    collapsed && "justify-center px-1",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent">
                    <Image
                      src={avatarSrc}
                      alt={displayName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/avt-default.jpg";
                      }}
                    />
                  </div>
                  {/* Name + email */}
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-sidebar-foreground truncate">
                        {displayName}
                      </p>
                      {user.email && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Logout icon */}
                  {!collapsed && (
                    <button
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Đăng xuất"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p className="font-semibold">{displayName}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </TooltipContent>
              )}
            </Tooltip>
          ) : mounted ? (
            /* Logout button when not authenticated */
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Đăng xuất</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>Đăng xuất</p>
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            /* Skeleton */
            <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center")}>
              <div className="h-8 w-8 rounded-full bg-sidebar-accent animate-pulse shrink-0" />
              {!collapsed && (
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-24 rounded bg-sidebar-accent animate-pulse" />
                  <div className="h-2 w-32 rounded bg-sidebar-accent animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border-sidebar-border bg-sidebar shadow-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
