"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthForm from "./AuthForm";
import { useAuth } from "@/store/hooks";
import { useEffect } from "react";

interface AuthModalProps {
  defaultTab?: "login" | "register";
}

export default function AuthModal({ defaultTab = "login" }: AuthModalProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  // If already authenticated, close modal and go back
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.back();
    }
  }, [isInitialized, isAuthenticated, router]);

  const handleClose = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.back();
    setTimeout(() => router.refresh(), 150);
  };

  // Don't render modal if already authenticated
  if (isInitialized && isAuthenticated) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative z-10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", stiffness: 350, damping: 25 },
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: 30,
            transition: { duration: 0.2 },
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <AuthForm defaultTab={defaultTab} onSuccess={handleSuccess} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
