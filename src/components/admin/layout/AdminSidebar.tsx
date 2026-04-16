"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  AlertTriangle,
  CalendarDays,
  Bug,
  Wallet,
  MessageSquare,
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
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "react-i18next";

interface NavChild {
  title: string;
  href: string;
  adminOnly?: boolean;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  /** If true, only ADMIN can see this item */
  adminOnly?: boolean;
  children?: NavChild[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}



export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: t("admin.sidebar.groups.overview"),
      items: [
        {
          title: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
        },
        {
          title: "Teacher Dashboard",
          href: "/admin/teacher-dashboard",
          icon: FileText,
        },
        {
          title: t("admin.sidebar.items.analytics"),
          href: "/admin/analytics",
          icon: BarChart3,
          children: [
            {
              title: t("admin.sidebar.items.analyticsTeachers"),
              href: "/admin/analytics/teachers",
            },
            {
              title: "Admin",
              href: "/admin/analytics/admin",
            },
          ],
        },
      ],
    },
    {
      label: t("admin.sidebar.groups.management"),
      items: [
        {
          title: t("admin.sidebar.items.users"),
          href: "/admin/users",
          icon: Users,
        },
        {
          title: t("admin.sidebar.items.withdraw"),
          href: "/admin/withdraw",
          icon: Wallet,
          adminOnly: true,
        },
        {
          title: t("admin.sidebar.items.courses"),
          href: "/admin/courses",
          icon: BookOpen,
          children: [
            {
              title: t("admin.sidebar.items.coursesManage"),
              href: "/admin/courses",
            },
            {
              title: t("admin.sidebar.items.coursesFinanceAdmin"),
              href: "/admin/courses/finance",
              adminOnly: true,
            },
            {
              title: t("admin.sidebar.items.coursesFinanceTeacher"),
              href: "/admin/courses/finance/teacher",
            },
          ],
        },
        {
          title: t("admin.sidebar.items.schedules"),
          href: "/admin/teacher-schedules",
          icon: CalendarDays,
        },
        {
          title: "Flashcard",
          href: "/admin/flashcard",
          icon: Layers,
        },
        {
          title: t("admin.sidebar.items.tests"),
          href: "/admin/jlpt-tests",
          icon: BookOpenCheck,
        },
        {
          title: t("admin.sidebar.items.voiceTopics"),
          href: "/admin/voice-topics",
          icon: BookOpen,
        },
      ],
    },
    {
      label: t("admin.sidebar.groups.system"),
      items: [
        {
          title: t("admin.sidebar.items.reports"),
          href: "/admin/reports",
          icon: AlertTriangle,
        },
        {
          title: t("admin.sidebar.items.systemErrors"),
          href: "/admin/system-errors",
          icon: Bug,
          adminOnly: true,
        },
        {
          title: "Chat Moderation",
          href: "/admin/chat-moderation",
          icon: MessageSquare,
        },
        {
          title: t("admin.sidebar.items.notifications"),
          href: "/admin/notifications",
          icon: Bell,
          badge: "3",
        },
        {
          title: t("admin.sidebar.items.roles"),
          href: "/admin/roles",
          icon: Shield,
          adminOnly: true,
        },
        {
          title: t("common.settings"),
          href: "/admin/settings",
          icon: Settings,
          adminOnly: true,
        },
      ],
    },
  ], [t, i18n.language]);
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, canAccessRoute } = usePermissions();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultOpenMenu = useMemo(() => {
    const matchedItem = navGroups
      .flatMap((group) => group.items)
      .find((item) =>
        item.children?.some(
          (child) =>
            pathname === child.href || pathname.startsWith(`${child.href}/`),
        ),
      );

    return matchedItem?.title ?? null;
  }, [pathname]);

  const displayName =
    user?.fullname || user?.fullName || user?.username || "Admin";
  const avatarSrc =
    user?.avatar || user?.avatarUrl || "/images/avt-default.jpg";

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
            {navGroups.map((group) => {
              // Filter items based on permissions
              const visibleItems = group.items
                .map((item) => {
                  if (!item.children || item.children.length === 0) return item;
                  const visibleChildren = item.children.filter((child) => {
                    if (isAdmin) return true;
                    if (child.adminOnly) return false;
                    return canAccessRoute(child.href);
                  });
                  return { ...item, children: visibleChildren };
                })
                .filter((item) => {
                  if (isAdmin) return true;
                  if (item.adminOnly) return false;
                  if (item.children && item.children.length > 0) return true;
                  return item.href ? canAccessRoute(item.href) : false;
                });
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label} className="mb-4">
                  {!collapsed && (
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  {collapsed && (
                    <Separator className="mb-2 bg-sidebar-border" />
                  )}
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const hasChildren =
                      item.children && item.children.length > 0;

                    const activeChildHref =
                      item.children?.reduce<string | null>(
                        (bestMatch, child) => {
                          const isMatch =
                            pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);

                          if (!isMatch) return bestMatch;
                          if (
                            !bestMatch ||
                            child.href.length > bestMatch.length
                          ) {
                            return child.href;
                          }
                          return bestMatch;
                        },
                        null,
                      ) ?? null;

                    const isOpen = (openMenu ?? defaultOpenMenu) === item.title;

                    const hasActiveChild = Boolean(activeChildHref);

                    const isActive =
                      hasActiveChild ||
                      (item.href &&
                        (pathname === item.href ||
                          (item.href !== "/admin" &&
                            pathname.startsWith(item.href))));

                    if (hasChildren) {
                      return (
                        <div key={item.title}>
                          <button
                            onClick={() =>
                              setOpenMenu(isOpen ? null : item.title)
                            }
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              collapsed && "justify-center px-2",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />

                            {!collapsed && (
                              <>
                                <span className="flex-1 text-left">
                                  {item.title}
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-90",
                                  )}
                                />
                              </>
                            )}
                          </button>

                          {isOpen && !collapsed && (
                            <div className="ml-6 mt-1 flex flex-col gap-1">
                              {item.children?.map((child) => {
                                const isChildActive =
                                  activeChildHref === child.href;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    title={child.title}
                                    className={cn(
                                      "flex items-center rounded-md border-l-2 px-3 py-1.5 text-sm transition-all",
                                      isChildActive
                                        ? "border-sidebar-primary bg-sidebar-accent/90 text-sidebar-primary"
                                        : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    )}
                                  >
                                    <span className="block min-w-0 flex-1 truncate whitespace-nowrap leading-5">
                                      {child.title}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const linkContent = (
                      <Link
                        href={item.href!}
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
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Bottom Actions */}
        <div className="p-3 flex flex-col gap-1">
          {/* Theme toggle */}
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
                {!collapsed && (
                  <span>{t("common.theme")} {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}</span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                <p>{t("common.toggleTheme")}</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Separator className="bg-sidebar-border my-1" />

          {/* User info + logout */}
          {isAuthenticated && user ? (
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
                        (e.target as HTMLImageElement).src =
                          "/images/avt-default.jpg";
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
                      title={t("auth.logout")}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p className="font-semibold">{displayName}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
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
                  {!collapsed && <span>{t("auth.logout")}</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>{t("auth.logout")}</p>
                </TooltipContent>
              )}
            </Tooltip>
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
