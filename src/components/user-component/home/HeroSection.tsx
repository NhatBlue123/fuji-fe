"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Lazy load Particles component — tránh load ~200KB tsparticles khi khởi động
const Particles = dynamic(() => import("@tsparticles/react").then(m => m.default), {
  ssr: false,
});

export function HeroSection() {
  const { t } = useTranslation();
  const [init, setInit] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setIsMounted(true), 0);
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
    return () => {
      window.clearTimeout(mountTimer);
    };
  }, []);

  // Lấy text từ i18n — fallback về tiếng Việt có dấu khi chưa mount
  const badge       = isMounted ? t("home.badge")        : "Nền tảng học tiếng Nhật số 1";
  const title       = isMounted ? t("home.title")        : "Học Tiếng Nhật";
  const easier      = isMounted ? t("home.easier")       : "Dễ Dàng Hơn.";
  const description = isMounted ? t("home.description")  : "Chinh phục tiếng Nhật cùng FUJI. Lộ trình cá nhân hóa với trợ lý AI.";
  const getStarted  = isMounted ? t("home.getStarted")   : "Bắt đầu ngay";
  const continueBtn = isMounted ? t("home.continueLearning") : "Tiếp tục học";

  return (
    <div className="relative w-full min-h-[600px] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 pb-64 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-blue-900/20">
      {/* Hiệu ứng tuyết */}
      {init && (
        <Particles
          id="tsparticles"
          className="absolute inset-0 z-[1]"
          options={{
            background: { opacity: 0 },
            fpsLimit: 30,
            particles: {
              color: { value: "#ffffff" },
              move: { direction: "bottom", enable: true, random: false, speed: 1.2, straight: false },
              number: { density: { enable: true }, value: 60 },
              opacity: { value: { min: 0.3, max: 0.8 } },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
              wobble: { enable: true, distance: 10, speed: 10 },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Background & overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home/bg_image.webp"
          alt="Japanese learning hero background"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-900/80 to-blue-900/10 mix-blend-multiply dark:from-[#0B1120] dark:via-[#0B1120]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent dark:from-[#0f172a]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl text-white pt-10">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6 shadow-glow">
          <span className="size-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#F472B6]" />
          <span className="text-xs font-bold tracking-wide uppercase text-secondary">
            {badge}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 tracking-tight drop-shadow-lg">
          {title} <br />
          <span className="text-secondary text-glow">{easier}</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 mb-8 font-light max-w-lg leading-relaxed drop-shadow-md">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/course"
            className="h-[52px] bg-pink-500 hover:bg-pink-400 text-white px-8 rounded-xl font-bold text-base transition-all transform hover:translate-y-[-2px] shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 group"
          >
            {getStarted}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
          <Button
            asChild
            variant="ghost"
            className="h-[52px] bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 hover:border-white/40"
          >
            <Link href="/ai-chat">
              <span className="material-symbols-outlined">smart_toy</span>
              {continueBtn}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
