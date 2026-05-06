"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatDockContent from "./ChatDockContent";
import AiAvatar from "./AiAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

/**
 * ChatDock - Floating AI Chat Widget
 * 
 * Features:
 * - Floating button to open/close chat
 * - Smooth animations with framer-motion
 * - Minimize/Maximize
 * - Full AssistantPanel functionality
 * - Auto-hide on /ai-chat and /sensei pages
 * - Responsive design
 * - Open in full page option
 */

export default function ChatDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Hide ChatDock on AI Chat and Sensei pages
  const shouldHide = pathname?.includes("/ai-chat") || pathname?.includes("/sensei");

  useEffect(() => {
    if (shouldHide && isOpen) {
      setIsOpen(false);
    }
  }, [shouldHide, isOpen]);

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/ai-chat");
      return;
    }
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
  }, [isOpen, isAuthenticated, router]);

  const handleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const handleOpenFullPage = useCallback(() => {
    router.push("/ai-chat");
    setIsOpen(false);
  }, [router]);

  if (shouldHide) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleToggle}
                className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all overflow-visible p-0"
              >
                <div className="absolute inset-0 flex items-center justify-center scale-[2.5]">
                  <AiAvatar className="w-full h-full" />
                </div>
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.div>
                )}

                {/* Pulse Animation */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </Button>
            </motion.div>

            {/* Tooltip - Only show on hover */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border rounded-lg px-4 py-2 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <p className="text-sm font-medium text-foreground">
                Trợ giảng AI FUJI
              </p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                <div className="border-8 border-transparent border-l-border" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px] border-8 border-transparent border-l-card" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggle}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-6 right-6 z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
              style={{
                width: isMinimized ? "400px" : "min(450px, calc(100vw - 3rem))",
                height: isMinimized ? "auto" : "min(85vh, calc(100vh - 3rem))",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-indigo-600/10 border-b border-border backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-1.5 shadow-lg shadow-primary/20 shrink-0">
                    <AiAvatar className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">Trợ giảng AI FUJI</h3>
                    <p className="text-xs text-muted-foreground truncate">Luôn sẵn sàng hỗ trợ bạn</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenFullPage}
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    title="Mở trang đầy đủ"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMinimize}
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    title={isMinimized ? "Mở rộng" : "Thu gọn"}
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    title="Đóng"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden flex flex-col min-h-0"
                >
                  <ChatDockContent />
                </motion.div>
              )}

              {/* Minimized State */}
              {isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Chat đã được thu gọn. Click <Maximize2 className="inline h-3 w-3" /> để mở rộng.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
