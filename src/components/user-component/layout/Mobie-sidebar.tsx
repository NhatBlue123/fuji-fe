"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MobieSidebar = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const menuItems = [
    { icon: "home", label: t("sidebar.home") || "Trang chủ", href: "/" },
    { icon: "school", label: t("sidebar.courses") || "Khóa học", href: "/course" },
    { icon: "quiz", label: "JLPT", href: "/JLPT_Practice" },
    { icon: "style", label: t("sidebar.flashcards") || "Flashcards", href: "/flashcards" },
    { icon: "smart_toy", label: "AI Chat", href: "/ai-chat" },
    { icon: "videocam", label: t("sidebar.videoCall") || "Video Call", href: "/video-call" },
    { icon: "calendar_month", label: t("sidebar.booking") || "Đặt lịch", href: "/booking" },
    { icon: "workspace_premium", label: "Premium", href: "/premium" },
  ];

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Mobile Header - Chỉ hiển thị trên mobile */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.5 
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button 
                variant="ghost" 
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Ripple effect */}
                <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500" />
                <span className="material-symbols-outlined text-2xl relative z-10">menu</span>
              </Button>
            </motion.div>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-[85vw] max-w-sm p-0 bg-background/98 backdrop-blur-xl border-l border-border/50 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <Link 
                      href="/" 
                      className="flex items-center gap-3 group"
                      onClick={() => setOpen(false)}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                        <Image 
                          src="/images/logofuji_v1.png" 
                          alt="FUJI Logo" 
                          width={40} 
                          height={28} 
                          quality={100} 
                          className="object-contain relative z-10" 
                          style={{ width: "auto", height: "auto" }}
                        />
                      </div>
                      <span className="font-black text-2xl bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                        FUJI
                      </span>
                    </Link>
                  </div>
                ) : (
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 group"
                    onClick={() => setOpen(false)}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                      <Image 
                        src="/images/logofuji_v1.png" 
                        alt="FUJI Logo" 
                        width={40} 
                        height={28} 
                        quality={100} 
                        className="object-contain relative z-10" 
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                    <span className="font-black text-2xl bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                      FUJI
                    </span>
                  </Link>
                )}
              </div>

              {/* Menu Items */}
              <ScrollArea className="flex-1 px-4 py-6">
                <motion.div 
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                >
                  {menuItems.map((item, index) => (
                    <motion.button
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl",
                        "text-left font-semibold text-sm",
                        "transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-rose-500/10",
                        "hover:translate-x-1 hover:shadow-md",
                        "active:scale-95",
                        "group"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <span className="flex-1 text-foreground dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        {item.label}
                      </span>
                      <span className="material-symbols-outlined text-base text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 opacity-0 group-hover:opacity-100 transition-all">
                        arrow_forward
                      </span>
                    </motion.button>
                  ))}
                </motion.div>

                <Separator className="my-6" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("common.quickActions") || "Truy cập nhanh"}
                  </p>
                  {[
                    { icon: "account_circle", label: t("common.profile") || "Hồ sơ", href: "/profile" },
                    { icon: "settings", label: t("common.settings") || "Cài đặt", href: "/settings" },
                    { icon: "notifications", label: t("common.notification") || "Thông báo", href: "/notifications" },
                    { icon: "help", label: t("common.help") || "Trợ giúp", href: "/help" },
                  ].map((item, index) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t border-border/50">
                {!isAuthenticated && (
                  <Button
                    onClick={() => handleNavigate("/login")}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all hover:scale-105 active:scale-95"
                  >
                    {t("auto.header_2") || "Đăng nhập"}
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default MobieSidebar;
