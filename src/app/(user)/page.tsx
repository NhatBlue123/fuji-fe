"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/store/hooks";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/user-component/home/HeroSection";
import { StreakCard } from "@/components/user-component/home/StreakCard";
import {
  BookOpen,
  FileCheck,
  Bot,
  Target,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   STATIC META — không gọi API, chỉ dùng i18n key để lấy text
   ──────────────────────────────────────────────────────────────── */

type QuickActionKey = "course" | "jlpt" | "aiChat" | "flashcards";

interface QuickAction {
  key: QuickActionKey;
  href: string;
  icon: typeof BookOpen;
  gradient: string;
  title: string;
  desc: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "course",
    href: "/course",
    icon: BookOpen,
    gradient: "from-blue-500 to-indigo-600",
    title: "Khóa học",
    desc: "Học theo lộ trình",
  },
  {
    key: "jlpt",
    href: "/JLPT_Practice",
    icon: FileCheck,
    gradient: "from-rose-500 to-red-600",
    title: "Luyện JLPT",
    desc: "Thi thử N5-N1",
  },
  {
    key: "aiChat",
    href: "/ai-chat",
    icon: Bot,
    gradient: "from-cyan-500 to-blue-600",
    title: "AI Chat",
    desc: "Trò chuyện với AI",
  },
  {
    key: "flashcards",
    href: "/flashcards",
    icon: Target,
    gradient: "from-pink-500 to-rose-600",
    title: "Flashcards",
    desc: "Luyện từ vựng",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex-1 bg-background dark:bg-[#0f172a] pb-20">
      {/* Hero Section */}
      <HeroSection />

      {/* Quick Actions - Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        className="px-6 md:px-12 lg:px-20 -mt-32 relative z-20"
      >
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.key} variants={fadeUp}>
                <Link
                  href={action.href}
                  className={cn(
                    "group flex flex-col items-center p-6 rounded-2xl transition-all duration-300",
                    "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
                    "hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                      action.gradient
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-center mb-1">
                    {action.title}
                  </h3>
                  <p className="text-slate-400 text-sm text-center">
                    {action.desc}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Resume Learning Card (if authenticated) */}
        {isMounted && isAuthenticated && (
          <motion.div variants={fadeUp} className="mb-12">
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Tiếp tục học
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Bắt đầu lại từ nơi bạn dừng lại
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold shadow-lg shadow-pink-500/25"
                >
                  <Link href="/course" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mini Dashboard Preview */}
        {isMounted && isAuthenticated && (
          <motion.div variants={fadeUp} className="mb-12">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">
                    Tiến bộ gần đây
                  </h3>
                </div>
                <Link
                  href="/dashboard"
                  className="text-sm text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
                >
                  Xem chi tiết
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-white mb-1">
                    {isMounted ? t("home.stats.courses", { lng: "vi" }) : "5"}
                  </div>
                  <div className="text-xs text-slate-400">Bài học</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-white mb-1">
                    {isMounted ? t("home.stats.students", { lng: "vi" }) : "23"}
                  </div>
                  <div className="text-xs text-slate-400">Từ vựng</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-white mb-1">78%</div>
                  <div className="text-xs text-slate-400">Độ chính xác</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 p-8 md:p-12 text-white shadow-2xl shadow-pink-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2">
                  Sẵn sàng bắt đầu?
                </h2>
                <p className="text-white/80">
                  Tham gia cùng hàng nghìn người học tiếng Nhật
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-pink-600 hover:bg-white/90 font-bold rounded-xl px-8"
                >
                  <Link href="/course">Bắt đầu ngay</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-bold rounded-xl px-8"
                >
                  <Link href="/dashboard">Xem Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
