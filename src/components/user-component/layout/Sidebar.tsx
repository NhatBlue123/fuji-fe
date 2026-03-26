"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  BookOpen, 
  FileCheck, 
  Calendar, 
  Bot, 
  Video, 
  Layers, 
  Settings, 
  ShieldCheck,
  Zap
} from "lucide-react";
import TopupModal from "@/components/user-component/premium/TopupModal";
import { useNotifications } from "@/providers/NotificationProvider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Sidebar Component - Cập nhật sửa lỗi:
 * - Hover khi mục đang chọn (isActive): Chữ giữ màu Trắng, không biến mất.
 * - Đồng bộ Typography: Loại bỏ In nghiêng/Bold đặc biệt (matching look).
 * - Match với giao diện UserSide bằng màu Secondary (Pink).
 */
const Sidebar = () => {
  const pathname = usePathname();
  const { roles } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const isAdminOrTeacher =
    roles &&
    (roles.includes("ADMIN") ||
      roles.includes("ROLE_ADMIN") ||
      roles.includes("INSTRUCTOR") ||
      roles.includes("ROLE_INSTRUCTOR"));

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { label: t("common.home"), path: "/", icon: Home },
    { label: t("common.course"), path: "/course", icon: BookOpen },
    { label: t("common.jlptPractice"), path: "/JLPT_Practice", icon: FileCheck },
    { label: t("common.booking"), path: "/booking", icon: Calendar },
    { label: t("common.aiPractice"), path: "/ai-chat", icon: Bot },
    { label: "/video-call", path: "/video-call", icon: Video, customLabel: "Video call" },
    { label: t("common.flashcard"), path: "/flashcards", icon: Layers },
    { label: "Cài đặt", path: "/settings", icon: Settings },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "relative hidden flex-col bg-sidebar border-r border-sidebar-border md:flex transition-all duration-300 ease-in-out z-40 shadow-sm font-sans",
          isCollapsed ? "w-16" : "w-58"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:text-secondary hover:border-secondary transition-all active:scale-95 active:translate-y-[1px]"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <Link
          href="/"
          className={cn(
            "flex h-16 items-center px-4 hover:bg-sidebar-accent/50 transition border-b border-sidebar-border overflow-hidden",
            isCollapsed ? "justify-center" : "gap-3 px-6"
          )}
        >
          <div className="flex-shrink-0 size-9 rounded-xl bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20">
            <span className="material-symbols-outlined text-2xl font-bold">landscape</span>
          </div>

          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="text-xl font-black text-sidebar-foreground leading-none tracking-tight">FUJI</h1>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">
                {isMounted ? t("sidebar.subtitle") : "Học Tiếng Nhật"}
              </p>
            </div>
          )}
        </Link>

        {/* NAVIGATION MENU */}
        <nav className="flex-1 overflow-y-auto px-3 pt-6 space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.path} disabled={!isCollapsed}>
                <TooltipTrigger asChild>
                  <Link 
                    href={item.path} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                      active 
                        ? "bg-secondary text-white font-black shadow-lg shadow-secondary/20 hover:text-white" 
                        : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                      active ? "text-white stroke-[3px]" : "group-hover:text-secondary"
                    )} />
                    
                    {!isCollapsed && (
                      <span className={cn(
                          "text-[13px] font-bold tracking-tight truncate transition-colors duration-200",
                          active ? "text-white" : "group-hover:text-secondary"
                        )}
                      >
                        {item.customLabel || item.label}
                      </span>
                    )}
                    
                    {active && !isCollapsed && (
                      <div className="absolute right-0 w-1 h-6 bg-white/20 rounded-l-full" />
                    )}
                    <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-colors" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-secondary text-white font-bold border-none shadow-xl scale-100 animate-in zoom-in-95 backdrop-blur-md">
                  {item.customLabel || item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          <div className="my-6 border-t border-sidebar-border mx-2 opacity-50" />

          {isMounted && isAdminOrTeacher && (
            <Tooltip disabled={!isCollapsed}>
              <TooltipTrigger asChild>
                <Link 
                  href="/admin" 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-foreground font-bold hover:bg-secondary/5 hover:text-secondary border border-transparent hover:border-secondary/20",
                    isActive("/admin") && "bg-secondary/10 text-secondary border-secondary/20"
                  )}
                >
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 group-hover:rotate-3 transition-transform text-secondary/70" />
                  {!isCollapsed && <span className="text-[11px] font-bold tracking-widest uppercase">Admin Workspace</span>}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-secondary text-white font-bold">Admin Workspace</TooltipContent>
            </Tooltip>
          )}
        </nav>

        {/* PREMIUM CARD */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            "bg-secondary/5 border border-secondary/20 rounded-[1.25rem] p-4 transition-all overflow-hidden relative group shadow-inner",
            isCollapsed && "p-2 items-center flex justify-center aspect-square"
          )}>
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg bg-secondary text-white hover:scale-110 shadow-lg shadow-secondary/30"
                onClick={() => setIsPremiumModalOpen(true)}
              >
                <Zap className="size-4 fill-current" />
              </Button>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="size-3.5 text-secondary fill-current animate-pulse" />
                  <p className="text-[9px] uppercase font-black tracking-widest text-secondary opacity-70">
                    Premium Plan
                  </p>
                </div>
                <h3 className="font-bold text-[13px] mb-3 leading-snug tracking-tighter uppercase">
                  {t("sidebar.premiumHeading") || "Nâng cấp gói học"}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px] font-black w-full border-secondary/30 bg-secondary/5 text-secondary hover:bg-secondary hover:text-white transition-all active:scale-95 rounded-xl uppercase tracking-widest"
                  onClick={() => setIsPremiumModalOpen(true)}
                >
                  {t("sidebar.viewDetails") || "Xem chi tiết"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <TopupModal 
          isOpen={isPremiumModalOpen} 
          onClose={() => setIsPremiumModalOpen(false)} 
        />
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
