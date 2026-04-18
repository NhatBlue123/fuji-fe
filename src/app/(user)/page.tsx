"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useInView } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/user-component/home/HeroSection";
import { StatsSection } from "@/components/user-component/home/StatsSection";

/* ─────────────────────────────────────────────────────────────────
   STATIC META — không gọi API, chỉ dùng i18n key để lấy text
   ──────────────────────────────────────────────────────────────── */

type CardKey = "course" | "jlpt" | "booking" | "aiChat" | "videoCall" | "flashcards2" | "premium2" | "wallet";

interface FeatureMeta {
  key: CardKey;
  href: string;
  icon: string;
  color: string;
  gradient: string;
  iconBg: string;
}

const FEATURE_META: FeatureMeta[] = [
  { key: "course",      href: "/course",          icon: "school",                 color: "blue",   gradient: "from-blue-500 to-indigo-600",    iconBg: "bg-blue-500/15 text-blue-500 dark:text-blue-400" },
  { key: "jlpt",        href: "/JLPT_Practice",   icon: "flag",                   color: "red",    gradient: "from-rose-500 to-red-600",       iconBg: "bg-rose-500/15 text-rose-500 dark:text-rose-400" },
  { key: "booking",     href: "/booking",          icon: "calendar_month",         color: "emerald",gradient: "from-emerald-500 to-teal-600",   iconBg: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400" },
  { key: "aiChat",      href: "/ai-chat",          icon: "smart_toy",              color: "cyan",   gradient: "from-cyan-500 to-blue-600",      iconBg: "bg-cyan-500/15 text-cyan-500 dark:text-cyan-400" },
  { key: "videoCall",   href: "/video-call",       icon: "videocam",               color: "indigo", gradient: "from-indigo-500 to-purple-600",  iconBg: "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400" },
  { key: "flashcards2", href: "/flashcards",       icon: "style",                  color: "pink",   gradient: "from-pink-500 to-rose-600",      iconBg: "bg-pink-500/15 text-pink-500 dark:text-pink-400" },
  { key: "premium2",    href: "/premium",          icon: "workspace_premium",      color: "amber",  gradient: "from-amber-500 to-orange-600",   iconBg: "bg-amber-500/15 text-amber-500 dark:text-amber-400" },
  { key: "wallet",      href: "/profile/wallet",   icon: "account_balance_wallet", color: "violet", gradient: "from-violet-500 to-purple-600",  iconBg: "bg-violet-500/15 text-violet-500 dark:text-violet-400" },
];

type ScenarioId = "speak" | "exam" | "career";
const SCENARIO_IDS: ScenarioId[] = ["speak", "exam", "career"];

const SCENARIO_META: Record<ScenarioId, { icon: string; gradient: string; primaryHref: string; secondaryHref: string }> = {
  speak:  { icon: "record_voice_over", gradient: "from-blue-600 via-cyan-500 to-blue-400",   primaryHref: "/ai-chat",    secondaryHref: "/video-call" },
  exam:   { icon: "quiz",              gradient: "from-rose-600 via-pink-500 to-orange-400",  primaryHref: "/JLPT_Practice", secondaryHref: "/course" },
  career: { icon: "trending_up",       gradient: "from-emerald-600 via-teal-500 to-green-400", primaryHref: "/premium",  secondaryHref: "/profile/wallet" },
};

interface MissionMeta {
  key: "flashcardsMission" | "jlptMission" | "bookingMission" | "aiMission";
  href: string;
  icon: string;
  progress: number;
  color: string;
}

const MISSIONS_META: MissionMeta[] = [
  { key: "flashcardsMission", href: "/flashcards",      icon: "auto_awesome",   progress: 68, color: "emerald" },
  { key: "jlptMission",       href: "/JLPT_Practice",   icon: "quiz",           progress: 40, color: "blue" },
  { key: "bookingMission",    href: "/booking",          icon: "event_available",progress: 85, color: "purple" },
  { key: "aiMission",         href: "/ai-chat",          icon: "smart_toy",      progress: 20, color: "cyan" },
];

type QuickKey = "notifications" | "profile" | "paymentHistory" | "subscription" | "withdraw" | "reports" | "settings" | "help";

const QUICK_META: Array<{ key: QuickKey; href: string; icon: string; color: string }> = [
  { key: "notifications",  href: "/notifications",           icon: "notifications",          color: "text-amber-500" },
  { key: "profile",        href: "/profile",                 icon: "account_circle",         color: "text-blue-500" },
  { key: "paymentHistory", href: "/profile/history-payment", icon: "receipt_long",           color: "text-emerald-500" },
  { key: "subscription",   href: "/profile/subscription",    icon: "subscriptions",          color: "text-purple-500" },
  { key: "withdraw",       href: "/withdraw",                icon: "payments",               color: "text-orange-500" },
  { key: "reports",        href: "/reports",                 icon: "bar_chart",              color: "text-cyan-500" },
  { key: "settings",       href: "/settings",               icon: "settings",               color: "text-slate-500" },
  { key: "help",           href: "/help",                   icon: "help",                   color: "text-pink-500" },
];

const JLPT_META = [
  { level: "N5", color: "from-sky-400 to-blue-600",   tests: 12, questions: 180 },
  { level: "N4", color: "from-emerald-400 to-teal-600",tests: 15, questions: 240 },
  { level: "N3", color: "from-violet-400 to-purple-600",tests: 18, questions: 320 },
  { level: "N2", color: "from-rose-400 to-red-600",   tests: 22, questions: 420 },
  { level: "N1", color: "from-amber-400 to-orange-600",tests: 25, questions: 500 },
] as const;

/* ─────────────────────────────────────────────────────────────────
   ANIMATION HELPERS
   ──────────────────────────────────────────────────────────────── */

function SlideReveal({
  children, className, direction = "left", delay = 0,
}: { children: ReactNode; className?: string; direction?: "left" | "right" | "up"; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const offset = { left: [-100, 0], right: [100, 0], up: [60, 0] };
  const [x, y] = direction === "up" ? [0, offset.up[0]] : direction === "left" ? [offset.left[0], 0] : [offset.right[0], 0];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.8, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FadeUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.8, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  return (
    <motion.div ref={ref} className={className}
      initial="hidden" animate={isInView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {children}
    </motion.div>
  );
}

const cardV = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.8, 0.25, 1] } },
};

/* ─────────────────────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const currentId = SCENARIO_IDS[scenarioIdx];

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-rotate scenarios
  useEffect(() => {
    const timer = setInterval(() => {
      setScenarioIdx((p) => (p + 1) % SCENARIO_IDS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const T = (key: string, opts?: Record<string, unknown>) =>
    isMounted ? t(key, opts) : t(key, { ...opts, lng: "vi" });

  return (
    <div className="flex-1 bg-background dark:bg-[#0f172a] pb-20">
      {/* ── HERO + STATS (giữ nguyên) ── */}
      <HeroSection />
      <StatsSection />

      <div className="mt-24 space-y-28 px-4 sm:px-6 md:px-12 lg:px-20">

        {/* ══════════════════════════════════════════════════════
            1. BẢN ĐỒ TÍNH NĂNG
            ════════════════════════════════════════════════════ */}
        <section>
          <SlideReveal direction="left">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  {T("home.featureMap.badge")}
                </div>
                <h2 className="text-3xl font-black tracking-tight text-foreground dark:text-white md:text-4xl">
                  {T("home.featureMap.title").split("một nơi")[0] || T("home.featureMap.title").split("一か所")[0]}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                    {T("home.featureMap.title").includes("một nơi") ? "một nơi" :
                     T("home.featureMap.title").includes("一か所") ? "一か所に" :
                     ""}
                  </span>
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground dark:text-slate-400 md:text-base">
                  {T("home.featureMap.subtitle")}
                </p>
              </div>
              <Button asChild className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5">
                <Link href="/course">
                  {T("home.featureMap.ctaBtn")}
                  <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                </Link>
              </Button>
            </div>
          </SlideReveal>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURE_META.map((f) => (
              <motion.div key={f.href} variants={cardV}>
                <Link
                  href={f.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10 dark:border-slate-700/60 dark:bg-[#151f35]/80"
                >
                  {/* Bottom gradient accent */}
                  <div className={cn("absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full", f.gradient)} />

                  {/* Icon + Badge */}
                  <div className="relative z-10 mb-5 flex items-center justify-between">
                    <div className={cn("flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", f.iconBg)}>
                      <span className="material-symbols-outlined text-[24px]">{f.icon}</span>
                    </div>
                    <span className="rounded-full border border-slate-200/80 bg-slate-100/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                      {T(`home.cards.${f.key}.badge`)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex-1">
                    <h3 className="text-[17px] font-bold leading-snug text-foreground dark:text-white">
                      {T(`home.cards.${f.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-slate-400">
                      {T(`home.cards.${f.key}.desc`)}
                    </p>
                  </div>

                  {/* Arrow link */}
                  <div className="relative z-10 mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 transition-all group-hover:gap-3 dark:text-blue-400">
                    {T("home.featureMap.openFeature")}
                    <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </Stagger>
        </section>

        {/* ══════════════════════════════════════════════════════
            2. JLPT LEVELS
            ════════════════════════════════════════════════════ */}
        <section>
          <SlideReveal direction="right">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
                  <span className="material-symbols-outlined text-sm">flag</span>
                  {T("home.jlptSection.badge")}
                </div>
                <h2 className="text-3xl font-black tracking-tight text-foreground dark:text-white md:text-4xl">
                  {T("home.jlptSection.titlePart1")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
                    {T("home.jlptSection.titleHighlight")}
                  </span>
                </h2>
              </div>
              <Link href="/JLPT_Practice" className="hidden items-center gap-1 font-bold text-rose-500 hover:text-rose-400 transition-colors md:flex">
                {T("home.jlptSection.viewAll")}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </SlideReveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {JLPT_META.map((item, i) => (
              <SlideReveal key={item.level} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.08}>
                <Link
                  href="/JLPT_Practice"
                  className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-xl dark:border-slate-700/60 dark:bg-[#151f35]/80"
                >
                  <div className={cn("mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white text-xl font-black shadow-lg transition-transform duration-300 group-hover:scale-110", item.color)}>
                    {item.level}
                  </div>
                  <p className="text-sm font-bold text-foreground dark:text-white">
                    {T(`home.jlptSection.levels.${item.level}`)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                    {item.tests} đề • {item.questions} câu
                  </p>
                  <div className={cn("mt-4 w-full rounded-lg bg-gradient-to-r py-2 text-xs font-bold text-white opacity-0 transition-all duration-300 group-hover:opacity-100", item.color)}>
                    {T("home.jlptSection.practiceNow")}
                  </div>
                </Link>
              </SlideReveal>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            3. KỊCH BẢN + NHIỆM VỤ + TRUY CẬP NHANH
            ════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_1fr]">
          {/* Left: Scenario Carousel */}
          <SlideReveal direction="left" className="h-full">
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-xl dark:border-slate-700/60 dark:bg-[#131d30]/90">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 px-6 py-5 dark:border-slate-700/40 md:px-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    {T("home.scenariosSection.badge")}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-foreground dark:text-white md:text-2xl">
                    {T("home.scenariosSection.title")}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {(["left", "right"] as const).map((dir, idx) => (
                    <button key={idx} type="button"
                      className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-background/80 transition-all hover:bg-muted dark:border-slate-600 dark:bg-slate-800"
                      onClick={() => setScenarioIdx((p) => idx === 0 ? (p - 1 + SCENARIO_IDS.length) % SCENARIO_IDS.length : (p + 1) % SCENARIO_IDS.length)}
                    >
                      <span className="material-symbols-outlined text-lg">{idx === 0 ? "chevron_left" : "chevron_right"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenario content */}
              <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentId}
                    initial={{ opacity: 0, x: 60, filter: "blur(8px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -60, filter: "blur(8px)" }}
                    transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div className={cn("flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white", SCENARIO_META[currentId].gradient)}>
                        <span className="material-symbols-outlined text-xl">{SCENARIO_META[currentId].icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">
                          {T(`home.scenariosSection.${currentId}.subtitle`)}
                        </p>
                        <h4 className="text-xl font-black text-foreground dark:text-white">
                          {T(`home.scenariosSection.${currentId}.title`)}
                        </h4>
                      </div>
                    </div>

                    <p className="mb-5 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                      {T(`home.scenariosSection.${currentId}.overview`)}
                    </p>

                    <div className="mb-6 space-y-2.5">
                      {(["b1", "b2", "b3"] as const).map((b, i) => (
                        <motion.div key={b} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                          className="flex items-start gap-2.5 text-sm text-foreground/90 dark:text-slate-200">
                          <span className="mt-0.5 material-symbols-outlined text-base text-emerald-500">check_circle</span>
                          <span>{T(`home.scenariosSection.${currentId}.${b}`)}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-bold text-white shadow-md transition-all">
                        <Link href={SCENARIO_META[currentId].primaryHref}>
                          {T(`home.scenariosSection.${currentId}.primary`)}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-10 rounded-xl border-blue-500/30 bg-blue-500/5 px-6 font-bold text-blue-600 hover:bg-blue-500/10 dark:text-blue-400">
                        <Link href={SCENARIO_META[currentId].secondaryHref}>
                          {T(`home.scenariosSection.${currentId}.secondary`)}
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dots */}
                <div className="mt-6 flex items-center gap-2">
                  {SCENARIO_IDS.map((id, i) => (
                    <button key={id} type="button" aria-label={`Kịch bản ${i + 1}`}
                      className={cn("h-2 rounded-full transition-all duration-300", scenarioIdx === i ? "w-8 bg-gradient-to-r from-blue-500 to-indigo-500" : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700")}
                      onClick={() => setScenarioIdx(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SlideReveal>

          {/* Right: Missions + Quick Links */}
          <div className="space-y-6">
            {/* Missions */}
            <SlideReveal direction="right">
              <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-lg dark:border-slate-700/60 dark:bg-[#141f32]/90">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <span className="material-symbols-outlined text-lg">task_alt</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground dark:text-white">
                      {T("home.missionsSection.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                      {T("home.missionsSection.count", { total: 4, completed: 2 })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {MISSIONS_META.map((m, i) => (
                    <FadeUp key={m.key} delay={i * 0.09}>
                      <Link href={m.href}
                        className="group block rounded-xl border border-border/50 bg-background/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("flex size-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                            m.color === "emerald" && "bg-emerald-500/15 text-emerald-500",
                            m.color === "blue"    && "bg-blue-500/15 text-blue-500",
                            m.color === "purple"  && "bg-purple-500/15 text-purple-500",
                            m.color === "cyan"    && "bg-cyan-500/15 text-cyan-500",
                          )}>
                            <span className="material-symbols-outlined text-lg">{m.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground dark:text-white truncate">
                              {T(`home.missionsSection.${m.key}.title`)}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">
                              {T(`home.missionsSection.${m.key}.desc`)}
                            </p>
                          </div>
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">{m.progress}%</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                          <motion.div
                            className={cn("h-full rounded-full bg-gradient-to-r",
                              m.color === "emerald" && "from-emerald-500 to-teal-400",
                              m.color === "blue"    && "from-blue-500 to-cyan-400",
                              m.color === "purple"  && "from-purple-500 to-indigo-400",
                              m.color === "cyan"    && "from-cyan-500 to-blue-400",
                            )}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${m.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground dark:text-slate-500">
                          {T(`home.missionsSection.${m.key}.eta`)}
                        </p>
                      </Link>
                    </FadeUp>
                  ))}
                </div>
              </div>
            </SlideReveal>

          </div>
        </section>

        {/* Quick Links — full width row */}
        <SlideReveal direction="up">
          <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-lg dark:border-slate-700/60 dark:bg-[#131e31]/90">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 text-white">
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </div>
              <h3 className="text-lg font-black text-foreground dark:text-white">
                {T("home.quickLinks.title")}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {QUICK_META.map((q, i) => (
                <FadeUp key={q.key} delay={i * 0.04}>
                  <Link href={q.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-bold text-muted-foreground transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    <span className={cn("material-symbols-outlined text-base", q.color)}>{q.icon}</span>
                    {T(`home.quickLinks.${q.key}`)}
                  </Link>
                </FadeUp>
              ))}
            </div>
          </div>
        </SlideReveal>

        {/* ══════════════════════════════════════════════════════
            4. AI CHAT + VIDEO CALL SHOWCASE
            ════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SlideReveal direction="left">
            <Link href="/ai-chat"
              className="group relative block overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1929] via-[#0f2240] to-[#132d52] p-8 text-white shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20 md:p-10"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl transition-all duration-700 group-hover:bg-cyan-500/25" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="pointer-events-none absolute right-6 top-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <span className="material-symbols-outlined text-[100px] text-cyan-300">smart_toy</span>
              </div>
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  {T("home.aiSection.badge")}
                </div>
                <h3 className="text-2xl font-black md:text-3xl">
                  {T("home.aiSection.title1")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                    {T("home.aiSection.titleHighlight")}
                  </span>
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300/90">
                  {T("home.aiSection.desc")}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-5 py-2.5 text-sm font-bold text-cyan-200 backdrop-blur-sm transition-all group-hover:bg-cyan-500/30">
                  {T("home.aiSection.cta")}
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>
            </Link>
          </SlideReveal>

          <SlideReveal direction="right">
            <Link href="/video-call"
              className="group relative block overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-[#120c29] via-[#1a0f40] to-[#221352] p-8 text-white shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/20 md:p-10"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl transition-all duration-700 group-hover:bg-indigo-500/25" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-500/15 blur-3xl" />
              <div className="pointer-events-none absolute right-6 top-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <span className="material-symbols-outlined text-[100px] text-indigo-300">videocam</span>
              </div>
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  {T("home.videoSection.badge")}
                </div>
                <h3 className="text-2xl font-black md:text-3xl">
                  {T("home.videoSection.title1")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">
                    {T("home.videoSection.titleHighlight")}
                  </span>
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300/90">
                  {T("home.videoSection.desc")}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500/20 px-5 py-2.5 text-sm font-bold text-indigo-200 backdrop-blur-sm transition-all group-hover:bg-indigo-500/30">
                  {T("home.videoSection.cta")}
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>
            </Link>
          </SlideReveal>
        </section>

        {/* ══════════════════════════════════════════════════════
            5. FLASHCARDS SHOWCASE
            ════════════════════════════════════════════════════ */}
        <section>
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
            <SlideReveal direction="left" className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-300">
                <span className="material-symbols-outlined text-sm">style</span>
                {T("home.flashSection.badge")}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground dark:text-white md:text-4xl lg:text-5xl">
                {T("home.flashSection.title")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-glow">
                  {T("home.flashSection.titleHighlight")}
                </span>
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground dark:text-slate-400">
                {T("home.flashSection.desc")}
              </p>
              <Button asChild className="h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5">
                <Link href="/flashcards">
                  <span className="material-symbols-outlined mr-1">auto_awesome</span>
                  {T("home.flashSection.cta")}
                </Link>
              </Button>
            </SlideReveal>

            <SlideReveal direction="right" className="flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute top-4 left-4 h-[280px] w-[220px] rotate-6 rounded-2xl border border-purple-500/20 bg-purple-100/50 dark:bg-purple-900/20 blur-[1px]" />
                <div className="absolute top-2 left-2 h-[280px] w-[220px] -rotate-3 rounded-2xl border border-pink-500/20 bg-pink-100/50 dark:bg-pink-900/20 blur-[1px]" />
                {/* Flashcard demo */}
                <div className="relative h-[280px] w-[220px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl dark:border-slate-700 dark:bg-[#1a2744]">
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-2 rounded-full bg-pink-500/10 px-3 py-0.5 text-[10px] font-bold text-pink-500 dark:text-pink-400">
                      {T("home.flashSection.kanjiLabel")}
                    </div>
                    <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
                      勉強
                    </h3>
                    <p className="mt-2 text-lg font-medium tracking-widest text-slate-500 dark:text-slate-400">
                      べんきょう
                    </p>
                    <div className="mt-4 rounded-lg border border-border/60 bg-muted/50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                      <span className="text-foreground dark:text-white font-bold">
                        {T("home.flashSection.kanjiMeaning")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SlideReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            6. BOOKING + PREMIUM
            ════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SlideReveal direction="left">
            <Link href="/booking"
              className="group relative block h-full overflow-hidden rounded-3xl border border-emerald-500/20 bg-card/90 p-7 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/60 dark:bg-[#121d2f]/90 md:p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="relative z-10">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 transition-transform group-hover:scale-110 duration-300">
                  <span className="material-symbols-outlined text-3xl">calendar_month</span>
                </div>
                <h3 className="text-xl font-black text-foreground dark:text-white md:text-2xl">
                  {T("home.bookingCard.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-slate-400">
                  {T("home.bookingCard.desc")}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">person</span>
                    {T("home.bookingCard.stat1")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">schedule</span>
                    {T("home.bookingCard.stat2")}
                  </span>
                </div>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all group-hover:gap-2">
                  {T("home.bookingCard.cta")}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>
            </Link>
          </SlideReveal>

          <SlideReveal direction="right">
            <Link href="/premium"
              className="group relative block h-full overflow-hidden rounded-3xl border border-amber-500/20 bg-card/90 p-7 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/60 dark:bg-[#121d2f]/90 md:p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all duration-700" />
              <div className="pointer-events-none absolute right-8 bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[120px] text-amber-400">workspace_premium</span>
              </div>
              <div className="relative z-10">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 transition-transform group-hover:scale-110 duration-300">
                  <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                </div>
                <h3 className="text-xl font-black text-foreground dark:text-white md:text-2xl">
                  {T("home.premiumCard.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-slate-400">
                  {T("home.premiumCard.desc")}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-sm">all_inclusive</span>
                    {T("home.premiumCard.stat1")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-sm">savings</span>
                    {T("home.premiumCard.stat2")}
                  </span>
                </div>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400 transition-all group-hover:gap-2">
                  {T("home.premiumCard.cta")}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>
            </Link>
          </SlideReveal>
        </section>

        {/* ══════════════════════════════════════════════════════
            7. FINAL CTA
            ════════════════════════════════════════════════════ */}
        <SlideReveal direction="up" className="pb-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-blue-500/25 bg-gradient-to-r from-[#0a1628] via-[#0f2240] to-[#152d52] p-8 text-white shadow-2xl shadow-blue-900/30 md:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  {T("home.finalCta.badge")}
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                  {T("home.finalCta.title")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-pink-400">
                    {T("home.finalCta.titleHighlight")}
                  </span>
                </h2>
                <p className="mt-3 text-sm text-blue-100/80 md:text-base">
                  {T("home.finalCta.desc")}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-7 font-black text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:-translate-y-0.5">
                  <Link href="/course">{T("home.finalCta.startLearning")}</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl border-white/30 bg-white/10 px-7 font-black text-white hover:bg-white/20 backdrop-blur-sm">
                  <Link href="/ai-chat">
                    <span className="material-symbols-outlined text-lg mr-1">smart_toy</span>
                    {T("home.finalCta.tryAI")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </SlideReveal>

      </div>
    </div>
  );
}
