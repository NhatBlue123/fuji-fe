"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/user-component/home/HeroSection";
import { StatsSection } from "@/components/user-component/home/StatsSection";

type CardKey =
  | "course"
  | "jlpt"
  | "booking"
  | "aiChat"
  | "videoCall"
  | "flashcards2"
  | "premium2"
  | "wallet";

interface FeatureMeta {
  key: CardKey;
  href: string;
  icon: string;
  tone: string;
}

const FEATURE_META: FeatureMeta[] = [
  { key: "course", href: "/course", icon: "school", tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300" },
  { key: "jlpt", href: "/JLPT_Practice", icon: "flag", tone: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300" },
  { key: "booking", href: "/booking", icon: "calendar_month", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { key: "aiChat", href: "/ai-chat", icon: "smart_toy", tone: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-300" },
  { key: "videoCall", href: "/video-call", icon: "videocam", tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300" },
  { key: "flashcards2", href: "/flashcards", icon: "style", tone: "text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-300" },
  { key: "premium2", href: "/premium", icon: "workspace_premium", tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
  { key: "wallet", href: "/profile/wallet", icon: "account_balance_wallet", tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300" },
];

type ScenarioId = "speak" | "exam" | "career";
const SCENARIO_IDS: ScenarioId[] = ["speak", "exam", "career"];

const SCENARIO_META: Record<
  ScenarioId,
  { icon: string; primaryHref: string; secondaryHref: string; image: string }
> = {
  speak: {
    icon: "record_voice_over",
    primaryHref: "/ai-chat",
    secondaryHref: "/video-call",
    image: "/images/home/scenario-speaking.webp",
  },
  exam: {
    icon: "quiz",
    primaryHref: "/JLPT_Practice",
    secondaryHref: "/course",
    image: "/images/home/scenario-jlpt.webp",
  },
  career: {
    icon: "trending_up",
    primaryHref: "/premium",
    secondaryHref: "/profile/wallet",
    image: "/images/home/scenario-career.webp",
  },
};

interface MissionMeta {
  key: "flashcardsMission" | "jlptMission" | "bookingMission" | "aiMission";
  href: string;
  progress: number;
}

const MISSIONS_META: MissionMeta[] = [
  { key: "flashcardsMission", href: "/flashcards", progress: 68 },
  { key: "jlptMission", href: "/JLPT_Practice", progress: 40 },
  { key: "bookingMission", href: "/booking", progress: 85 },
  { key: "aiMission", href: "/ai-chat", progress: 20 },
];

type QuickKey =
  | "notifications"
  | "profile"
  | "paymentHistory"
  | "subscription"
  | "withdraw"
  | "reports"
  | "settings"
  | "help";

const QUICK_META: Array<{ key: QuickKey; href: string }> = [
  { key: "notifications", href: "/notifications" },
  { key: "profile", href: "/profile" },
  { key: "paymentHistory", href: "/profile/history-payment" },
  { key: "subscription", href: "/profile/subscription" },
  { key: "withdraw", href: "/withdraw" },
  { key: "reports", href: "/reports" },
  { key: "settings", href: "/settings" },
  { key: "help", href: "/help" },
];

const JLPT_META = [
  { level: "N5", tone: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200", tests: 12, questions: 180 },
  { level: "N4", tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200", tests: 15, questions: 240 },
  { level: "N3", tone: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200", tests: 18, questions: 320 },
  { level: "N2", tone: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200", tests: 22, questions: 420 },
  { level: "N1", tone: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200", tests: 25, questions: 500 },
] as const;

const HOME_MEDIA = {
  featureStudio: "/images/home/fuji-study-studio.webp",
  jlptDesk: "/images/home/jlpt-desk-practice.webp",
  aiVideo: "/video/home/ai-speaking-session.mp4",
  aiPoster: "/images/home/ai-speaking-session-poster.webp",
  teacherSession: "/images/home/teacher-session.webp",
  flashcards: "/images/home/flashcards-kanji-table.webp",
  premiumPlan: "/images/home/premium-learning-plan.webp",
  finalVideo: "/video/home/fuji-home-closing-loop.mp4",
  finalPoster: "/images/home/fuji-home-closing-poster.webp",
};

function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.18 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.25, 0.8, 0.25, 1] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-500/90">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
        {title} {highlight && <span className="text-pink-500">{highlight}</span>}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function MediaSurface({
  src,
  poster,
  kind = "image",
  className,
  children,
}: {
  src: string;
  poster?: string;
  kind?: "image" | "video";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted/50 shadow-sm dark:border-white/10 dark:bg-slate-900/60",
        className,
      )}
    >
      {kind === "video" ? (
        <video
          className="absolute inset-0 size-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}

function FeatureCard({ feature, label }: { feature: FeatureMeta; label: (key: string) => string }) {
  return (
    <Link
      href={feature.href}
      className="group flex min-h-[170px] flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink-300/70 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35"
    >
      <div>
        <div className={cn("mb-4 flex size-10 items-center justify-center rounded-full", feature.tone)}>
          <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {label(`home.cards.${feature.key}.title`)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {label(`home.cards.${feature.key}.desc`)}
        </p>
      </div>
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-pink-500">
        {label("home.featureMap.openFeature")}
        <span className="material-symbols-outlined ml-1 text-[16px] transition-transform group-hover:translate-x-1">
          arrow_forward
        </span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const currentId = SCENARIO_IDS[scenarioIdx];
  const aiVideoRef = useRef<HTMLVideoElement>(null);
  const [isAiVideoMuted, setIsAiVideoMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setScenarioIdx((current) => (current + 1) % SCENARIO_IDS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const videoElement = aiVideoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement.play().catch(() => {
              // Nếu autoplay bị chặn, thử phát muted
              videoElement.muted = true;
              setIsAiVideoMuted(true);
              videoElement.play();
            });
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleAiVideoMute = () => {
    if (aiVideoRef.current) {
      aiVideoRef.current.muted = !isAiVideoMuted;
      setIsAiVideoMuted(!isAiVideoMuted);
    }
  };

  const T = (key: string, opts?: Record<string, unknown>) => t(key, opts);

  const currentScenario = SCENARIO_META[currentId];

  return (
    <div className="flex-1 bg-background pb-16 dark:bg-[#0f172a]">
      <HeroSection />
      <StatsSection />

      <div className="mx-auto mt-14 w-full max-w-[1480px] space-y-20 px-4 sm:px-6 lg:px-10 xl:px-16">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.35fr] lg:items-end">
          <FadeUp className="space-y-6">
            <SectionIntro
              eyebrow={T("home.featureMap.badge")}
              title={T("home.featureMap.title").replace("một nơi", "").replace("一か所に", "")}
              highlight={
                T("home.featureMap.title").includes("một nơi")
                  ? "một nơi"
                  : T("home.featureMap.title").includes("一か所")
                    ? "一か所に"
                    : undefined
              }
              description={T("home.featureMap.subtitle")}
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-full bg-pink-500 px-6 font-semibold text-white hover:bg-pink-600">
                <Link href="/course">{T("home.featureMap.ctaBtn")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-6 font-semibold">
                <Link href="/ai-chat">{T("home.finalCta.tryAI")}</Link>
              </Button>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <MediaSurface src={HOME_MEDIA.featureStudio} className="min-h-[280px] sm:min-h-[360px]">
              <div className="flex h-full items-end p-6 sm:p-8">
                <div className="max-w-md rounded-2xl border border-white/15 bg-black/30 p-5 text-white backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    FUJI Workspace
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-tight">
                    Một hành trình học gọn hơn, ít nhiễu hơn.
                  </p>
                </div>
              </div>
            </MediaSurface>
          </FadeUp>
        </section>

        <section>
          <FadeUp>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionIntro
                eyebrow="Learning tools"
                title="Các công cụ chính"
                description="Giữ lại đầy đủ chức năng hiện có, nhưng trình bày nhẹ hơn để người học quét nhanh và chọn đúng việc cần làm."
              />
              <Link href="/course" className="text-sm font-semibold text-pink-500 hover:text-pink-600">
                {T("home.jlptSection.viewAll")}
              </Link>
            </div>
          </FadeUp>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_META.map((feature, index) => (
              <FadeUp key={feature.key} delay={index * 0.035}>
                <FeatureCard feature={feature} label={T} />
              </FadeUp>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <FadeUp className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/35 sm:p-8">
            <SectionIntro
              eyebrow={T("home.jlptSection.badge")}
              title={T("home.jlptSection.titlePart1")}
              highlight={T("home.jlptSection.titleHighlight")}
            />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {JLPT_META.map((item) => (
                <Link
                  key={item.level}
                  href="/JLPT_Practice"
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md",
                    item.tone,
                  )}
                >
                  <div className="text-2xl font-black">{item.level}</div>
                  <p className="mt-2 text-xs font-semibold">
                    {T(`home.jlptSection.levels.${item.level}`)}
                  </p>
                  <p className="mt-1 text-[11px] opacity-75">
                    {item.tests} đề / {item.questions} câu
                  </p>
                </Link>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <MediaSurface src={HOME_MEDIA.jlptDesk} className="h-full min-h-[330px]">
              <div className="flex h-full items-end p-6">
                <div className="max-w-xs text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    JLPT Practice
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    Luyện đề đều đặn, xem lại lỗi sai và tiến bộ rõ sau từng buổi học.
                  </p>
                </div>
              </div>
            </MediaSurface>
          </FadeUp>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <FadeUp>
            <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm dark:border-white/10 dark:bg-slate-950/35">
              <div className="grid min-h-[430px] lg:grid-cols-[0.95fr_1.05fr]">
                <div className="p-6 sm:p-8">
                  <SectionIntro
                    eyebrow={T("home.scenariosSection.badge")}
                    title={T(`home.scenariosSection.${currentId}.title`)}
                    description={T(`home.scenariosSection.${currentId}.overview`)}
                  />
                  <div className="mt-7 flex gap-2">
                    {SCENARIO_IDS.map((id, index) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setScenarioIdx(index)}
                        className={cn(
                          "h-2.5 rounded-full transition-all",
                          id === currentId ? "w-10 bg-pink-500" : "w-2.5 bg-muted-foreground/30",
                        )}
                        aria-label={id}
                      />
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild className="h-11 rounded-full bg-foreground px-6 text-background hover:bg-foreground/90">
                        <Link href={currentScenario.primaryHref}>
                        {T(`home.scenariosSection.${currentId}.primary`)}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-full px-6">
                        <Link href={currentScenario.secondaryHref}>
                        {T(`home.scenariosSection.${currentId}.secondary`)}
                      </Link>
                    </Button>
                  </div>
                </div>
                <MediaSurface src={currentScenario.image} className="min-h-[300px] rounded-none border-0 shadow-none">
                  <div className="flex h-full items-start justify-end p-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                      <span className="material-symbols-outlined">{currentScenario.icon}</span>
                    </div>
                  </div>
                </MediaSurface>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <div className="h-full rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/35 sm:p-7">
              <SectionIntro
                eyebrow="Daily focus"
                title={T("home.missionsSection.title")}
                description={T("home.missionsSection.desc")}
              />
              <div className="mt-7 space-y-4">
                {MISSIONS_META.map((mission) => (
                  <Link key={mission.key} href={mission.href} className="block rounded-2xl border border-border/70 p-4 transition-colors hover:border-pink-300/70 dark:border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {T(`home.missionsSection.${mission.key}.title`)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {T(`home.missionsSection.${mission.key}.eta`)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-pink-500">
                        {mission.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-pink-500" style={{ width: `${mission.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </FadeUp>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <FadeUp>
            <div className="group overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35">
              <div className="relative h-[310px] overflow-hidden rounded-none bg-muted/50">
                <Image
                  src={HOME_MEDIA.aiPoster}
                  alt="AI Chat"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
                />
                <video
                  ref={aiVideoRef}
                  className="absolute inset-0 size-full object-cover"
                  src={HOME_MEDIA.aiVideo}
                  poster={HOME_MEDIA.aiPoster}
                  loop
                  playsInline
                  preload="none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <button
                  type="button"
                  onClick={toggleAiVideoMute}
                  className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                  aria-label={isAiVideoMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isAiVideoMuted ? "volume_off" : "volume_up"}
                  </span>
                </button>
              </div>
              <Link href="/ai-chat" className="block p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  {T("home.aiSection.badge")}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {T("home.aiSection.title1")}{" "}
                  <span className="text-cyan-500">{T("home.aiSection.titleHighlight")}</span>
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {T("home.aiSection.desc")}
                </p>
              </Link>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <Link
              href="/video-call"
              className="group block overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35"
            >
              <MediaSurface src={HOME_MEDIA.teacherSession} className="h-[310px] rounded-none border-0 shadow-none" />
              <div className="p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
                  {T("home.videoSection.badge")}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {T("home.videoSection.title1")}{" "}
                  <span className="text-indigo-500">{T("home.videoSection.titleHighlight")}</span>
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {T("home.videoSection.desc")}
                </p>
              </div>
            </Link>
          </FadeUp>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <FadeUp>
            <MediaSurface src={HOME_MEDIA.flashcards} className="min-h-[420px]" />
          </FadeUp>
          <FadeUp delay={0.08} className="space-y-6">
            <SectionIntro
              eyebrow={T("home.flashSection.badge")}
              title={T("home.flashSection.title")}
              highlight={T("home.flashSection.titleHighlight")}
              description={T("home.flashSection.desc")}
            />
            <Button asChild className="h-11 rounded-full bg-pink-500 px-6 font-semibold text-white hover:bg-pink-600">
              <Link href="/flashcards">{T("home.flashSection.cta")}</Link>
            </Button>
          </FadeUp>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <FadeUp>
            <Link href="/booking" className="group grid min-h-[360px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35 sm:grid-cols-[0.9fr_1.1fr]">
              <MediaSurface src={HOME_MEDIA.teacherSession} className="min-h-[220px] rounded-none border-0 shadow-none" />
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Booking
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {T("home.bookingCard.title")}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {T("home.bookingCard.desc")}
                </p>
                <p className="mt-5 text-sm font-semibold text-emerald-500">
                  {T("home.bookingCard.cta")}
                </p>
              </div>
            </Link>
          </FadeUp>

          <FadeUp delay={0.08}>
            <Link href="/premium" className="group grid min-h-[360px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35 sm:grid-cols-[0.9fr_1.1fr]">
              <MediaSurface src={HOME_MEDIA.premiumPlan} className="min-h-[220px] rounded-none border-0 shadow-none" />
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500">
                  Premium
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {T("home.premiumCard.title")}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {T("home.premiumCard.desc")}
                </p>
                <p className="mt-5 text-sm font-semibold text-amber-500">
                  {T("home.premiumCard.cta")}
                </p>
              </div>
            </Link>
          </FadeUp>
        </section>

        <FadeUp>
          <section className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/35 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {T("home.quickLinks.title")}
              </h3>
              <span className="text-sm text-muted-foreground">
                FUJI
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_META.map((quick) => (
                <Link
                  key={quick.key}
                  href={quick.href}
                  className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-pink-300 hover:text-pink-500 dark:border-white/10"
                >
                  {T(`home.quickLinks.${quick.key}`)}
                </Link>
              ))}
            </div>
          </section>
        </FadeUp>

        <FadeUp className="pb-2">
          <section className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
            <Image
              src={HOME_MEDIA.finalPoster}
              alt="FUJI"
              fill
              className="object-cover opacity-70"
              sizes="(max-width: 768px) 100vw, 90vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
            />
            <video
              className="absolute inset-0 size-full object-cover opacity-70"
              src={HOME_MEDIA.finalVideo}
              poster={HOME_MEDIA.finalPoster}
              autoPlay
              loop
              muted
              playsInline
              preload="none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/10" />
            <div className="relative z-10 flex min-h-[380px] flex-col justify-center p-8 sm:p-10 lg:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-300">
                {T("home.finalCta.badge")}
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                {T("home.finalCta.title")}{" "}
                <span className="text-pink-300">{T("home.finalCta.titleHighlight")}</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                {T("home.finalCta.desc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-full bg-pink-500 px-6 font-semibold text-white hover:bg-pink-600">
                  <Link href="/course">{T("home.finalCta.startLearning")}</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-6 font-semibold text-white hover:bg-white/20">
                  <Link href="/ai-chat">{T("home.finalCta.tryAI")}</Link>
                </Button>
              </div>
            </div>
          </section>
        </FadeUp>
      </div>
    </div>
  );
}
