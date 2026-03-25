"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  MoreHorizontal, 
  Trash2, 
  BellOff, 
  Inbox, 
  Eye,
  Undo2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useNotifications } from "@/providers/NotificationProvider";
import { NotificationType } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * NotificationsPage - Tinh chỉnh cuối:
 * - Loại bỏ Avatar tròn.
 * - Triển khai hành động Xóa kèm theo Hoàn tác (Undo).
 * - Sửa màu nút Xóa trong Dropdown (không dùng đỏ).
 * - Đồng bộ khoảng cách với Header (giảm py-10 xuống py-2).
 */
export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, setNotifications } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter(n => !n.isRead);
    return notifications;
  }, [notifications, activeTab]);

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.linkUrl && n.type !== NotificationType.reminder) router.push(n.linkUrl);
  };

  const handleDelete = async (id: number) => {
    const backup = [...notifications];
    const target = notifications.find(n => n.id === id);
    
    // Xóa tạm thời ở UI
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    toast.success("Đã xóa thông báo", {
      action: {
        label: "Hoàn tác",
        onClick: () => {
          setNotifications(backup);
        }
      },
      onAutoClose: () => {
        // Nếu không hoàn tác thì mới gọi API xóa thật
        deleteNotification(id);
      }
    });
  };

  return (
    <div className="w-full py-8 font-sans antialiased animate-in fade-in duration-300">
      <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        
        {/* HEADER & TABS - Khoảng cách tối thiểu */}
        <div className="px-6 py-5 border-b border-border bg-background/50 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black tracking-tight uppercase">Thông báo</h1>
            {unreadCount > 0 && (
              <Badge className="bg-secondary text-white border-none rounded-full px-2 py-0.5 text-[9px] font-black">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-muted p-1 rounded-xl h-9 border border-border">
                <TabsTrigger value="all" className="rounded-lg px-5 font-bold text-[11px] data-[state=active]:bg-background transition-all">
                  Tất cả
                </TabsTrigger>
                <TabsTrigger value="unread" className="rounded-lg px-5 font-bold text-[11px] data-[state=active]:bg-background transition-all">
                  Chưa đọc
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAllAsRead()}
                className="text-secondary font-bold text-[11px] hover:bg-secondary/5 rounded-xl transition-all"
            >
                Đọc tất cả
            </Button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST - Loại bỏ Avatar */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => {
                  const isFriendInvite = n.content.toLowerCase().includes("kết bạn") || n.title.toLowerCase().includes("kết bạn");
                  
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative flex items-start gap-3 p-5 transition-all border-b border-border/50 last:border-none",
                        !n.isRead ? "bg-secondary/[0.03]" : "hover:bg-muted/30"
                      )}
                    >
                      {/* Thay Avatar thành Icon loại thông báo hoặc chỉ Status Indicator */}
                      <div className={cn(
                        "size-2 rounded-full mt-2.5 flex-shrink-0 transition-all",
                        !n.isRead ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-muted-foreground/20"
                      )} />

                      <div className="flex-1 min-w-0 pr-10 cursor-pointer" onClick={() => handleNotificationClick(n)}>
                        <h3 className={cn(
                          "text-[14px] leading-snug break-words mb-1.5",
                          !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"
                        )}>
                          <span className="font-extrabold text-secondary mr-2">{n.title}</span>
                          {n.content}
                        </h3>
                        
                        {isFriendInvite && !n.isRead && (
                          <div className="flex items-center gap-2 mt-3 mb-1">
                            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white rounded-lg px-5 h-8 font-bold text-[11px] transition-all active:scale-95 shadow-lg shadow-secondary/10">
                               Xác nhận
                            </Button>
                            <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground rounded-lg px-5 h-8 font-bold text-[11px] transition-all active:scale-95">
                               Xóa
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 opacity-50">
                           <Clock className="size-3" />
                           <span className="text-[10px] font-bold uppercase tracking-tight">
                             {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                           </span>
                        </div>
                      </div>

                      {/* Dropdown 3 chấm */}
                      <div className="absolute right-4 top-5">
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
                          <DropdownMenuContent className="w-60 rounded-2xl p-2 shadow-2xl border-secondary/10 bg-popover" align="end">
                            <DropdownMenuItem 
                              onClick={() => markAsRead(n.id)}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                            >
                              <CheckCheck className="size-4" /> Đánh dấu đã đọc
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleNotificationClick(n)}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                            >
                              <Eye className="size-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(n.id)}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                            >
                              <Trash2 className="size-4" /> Xóa thông báo
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => toast.success("Đã tắt thông báo tương tự")}
                              className="rounded-xl py-3 cursor-pointer gap-3 font-bold text-[12px] whitespace-nowrap tracking-tight text-muted-foreground hover:text-secondary focus:text-secondary focus:bg-secondary/5 transition-all"
                            >
                              <BellOff className="size-4" /> Tắt thông báo tương tự
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
                  <p className="font-black uppercase tracking-widest text-xs">Hộp thư trống</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-center">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase hover:text-secondary transition-all h-6">
                Tùy chỉnh trung tâm thông báo
            </Button>
        </div>
      </div>
    </div>
  );
}
