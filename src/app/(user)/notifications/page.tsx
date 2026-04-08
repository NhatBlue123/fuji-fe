"use client";

/**
 * NotificationsPage.tsx
 * 
 * Trung tâm thông báo chính của hệ thống cho người dùng.
 * Cung cấp các cảnh báo thời gian thực, lọc theo danh mục và logic tương tác
 * giữa hệ thống và người dùng.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  MoreHorizontal, 
  Trash2, 
  Inbox, 
  Eye,
  Undo2,
  LifeBuoy,
  RotateCcw,
  type LucideIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";

import { useNotifications } from "@/providers/NotificationProvider";
import { NotificationType, type Notification as NotifType } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  [NotificationType.course]: "Khóa học",
  [NotificationType.system]: "Hệ thống",
  [NotificationType.reminder]: "Nhắc nhở",
  [NotificationType.security]: "Bảo mật",
};

function isCourseNotification(n: NotifType) {
  if (n.type === NotificationType.course) return true;
  if (n.type !== NotificationType.reminder) return false;

  const related = (n.relatedType || "").toUpperCase();
  const link = (n.linkUrl || "").toLowerCase();
  const title = (n.title || "").toLowerCase();

  return (
    related.includes("BOOKING") ||
    link.includes("/booking") ||
    link.includes("/learn/session") ||
    title.includes("giờ học") ||
    title.includes("buổi học")
  );
}

function getNotificationTypeLabel(n: NotifType) {
  if (isCourseNotification(n)) return "Khóa học";
  return TYPE_LABELS[n.type] ?? "Khác";
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, setNotifications } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter(n => !n.isRead);
    if (activeTab === "course") return notifications.filter(isCourseNotification);
    if (activeTab === "system") return notifications.filter(n => n.type === NotificationType.system);
    if (activeTab === "reminder")
      return notifications.filter(
        n => n.type === NotificationType.reminder && !isCourseNotification(n)
      );
    if (activeTab === "security") return notifications.filter(n => n.type === NotificationType.security);
    return notifications;
  }, [notifications, activeTab]);

  // Điều hướng đến trang chi tiết chính xác dựa trên linkUrl
  const navigateToDetail = (n: NotifType) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  const handleDelete = async (id: number) => {
    const backup = [...notifications];
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    toast.success("Đã xóa thông báo", {
      action: {
        label: "Hoàn tác",
        onClick: () => {
          setNotifications(backup);
        }
      },
      onAutoClose: () => {
        deleteNotification(id);
      }
    });
  };

  return (
    <div className="w-full px-4 sm:px-4 py-4 font-sans antialiased animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>
        
        {/* HEADER & TABS */}
        <div className="px-6 py-5 border-b border-border bg-background/50 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black tracking-tight uppercase">Thông báo</h1>
              {unreadCount > 0 && (
                <Badge className="bg-secondary text-white border-none rounded-full px-2 py-0.5 text-[9px] font-black">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => window.location.reload()}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary/10 hover:text-secondary group transition-all"
              >
                  <RotateCcw className="size-4 group-hover:rotate-45 transition-transform" />
              </Button>
              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllAsRead()}
                  className="text-secondary font-bold text-[11px] hover:bg-secondary/5 rounded-xl transition-all"
              >
                  <CheckCheck className="size-3.5 mr-1.5" />
                  Đọc tất cả
              </Button>
            </div>
          </div>

          {/* Các tab lọc thông báo — phong cách monochrome */}
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted p-1 rounded-xl h-9 border border-border w-full justify-start gap-0 overflow-x-auto">
              <TabsTrigger value="all" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Tất cả
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Chưa đọc {unreadCount > 0 && <span className="ml-1 text-secondary">({unreadCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="course" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Khóa học
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Hệ thống
              </TabsTrigger>
              <TabsTrigger value="reminder" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Nhắc nhở
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg px-3 font-bold text-[10px] data-[state=active]:bg-background transition-all">
                Bảo mật
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* DANH SÁCH THÔNG BÁO */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => {
                  const typeLabel = getNotificationTypeLabel(n);
                  
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative flex items-start gap-3.5 py-4 px-5 transition-all border-b border-border/50 last:border-none",
                        !n.isRead
                          ? "bg-secondary/[0.06] dark:bg-secondary/[0.08] border-l-[3px] border-l-secondary"
                          : "hover:bg-muted/30 opacity-70 border-l-[3px] border-l-transparent"
                      )}
                    >
                      {/* Chấm chỉ thông báo chưa đọc */}
                      <div className={cn(
                        "size-2.5 rounded-full mt-2 flex-shrink-0 transition-all",
                        !n.isRead 
                          ? "bg-secondary shadow-[0_0_8px_rgba(var(--secondary-rgb,59,130,246),0.5)]" 
                          : "bg-muted-foreground/15"
                      )} />

                      <div className="flex-1 min-w-0 pr-10 cursor-pointer" onClick={() => navigateToDetail(n)}>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block">
                          {typeLabel}
                        </span>
                        <h3 className={cn(
                          "text-[14px] leading-snug break-words mb-1",
                          !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/60"
                        )}>
                          <span className={cn(
                            "font-extrabold mr-1.5",
                            !n.isRead ? "text-secondary" : "text-muted-foreground"
                          )}>{n.title}</span>
                          {n.content}
                        </h3>

                        <div className="flex items-center gap-2 mt-1.5">
                           <Clock className="size-3 text-muted-foreground/40" />
                           <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/40">
                             {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                           </span>
                        </div>
                      </div>

                      {/* Menu thả xuống */}
                      <div className="absolute right-4 top-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all hover:bg-secondary/10 hover:text-secondary"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-2xl border-secondary/10 bg-popover" align="end">
                            {!n.isRead && (
                              <DropdownMenuItem 
                                onClick={() => markAsRead(n.id)}
                                className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                              >
                                <CheckCheck className="size-4" /> Đánh dấu đã đọc thông báo này
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem 
                              onClick={() => setIsFeedbackOpen(true)}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                            >
                              <LifeBuoy className="size-4" /> Báo cáo sự cố đến đội ngũ FUJI
                            </DropdownMenuItem>

                            {n.linkUrl && (
                              <DropdownMenuItem 
                                onClick={() => navigateToDetail(n)}
                                className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                              >
                                <Eye className="size-4" /> Xem chi tiết
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(n.id)}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-destructive focus:text-destructive focus:bg-destructive/5 transition-all"
                            >
                              <Trash2 className="size-4" /> Xóa thông báo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-40 opacity-20 transition-all">
                  <Inbox className="size-16 mb-4 animate-bounce duration-1000" />
                  <p className="font-black uppercase tracking-widest text-xs">
                    {activeTab === "all" ? "Hộp thư trống" : `Không có thông báo ${TYPE_LABELS[activeTab] ?? "trong mục này"}`}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* PHẦN CHÂN TRANG */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-center">
            <Link href="/settings?tab=notifications">
              <Button variant="ghost" size="sm" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase hover:text-secondary transition-all h-6">
                  Tùy chỉnh trung tâm thông báo
              </Button>
            </Link>
        </div>
      </div>
      <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
