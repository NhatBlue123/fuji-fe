"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
// Thêm các import mới
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export function HeroSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [init, setInit] = useState(false);

  // Khởi tạo engine cho hạt (particles)
  useEffect(() => {
    setIsMounted(true);
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className="relative w-full min-h-[680px] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 pb-72 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-blue-900/20">
      
      {/* Container Hiệu ứng Tuyết */}
      {init && (
        <Particles
          id="tsparticles"
          className="absolute inset-0 z-[1]"
          options={{
            background: { opacity: 0 },
            fpsLimit: 60,
            particles: {
              color: { value: "#ffffff" },
              move: {
                direction: "bottom",
                enable: true,
                random: false,
                speed: 1.5, // Tốc độ rơi
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 350, // Số lượng hạt tuyết
              },
              opacity: {
                value: { min: 0.3, max: 0.8 },
              },
              shape: { type: "circle" },
              size: {
                value: { min: 1, max: 3 },
              },
              wobble: {
                enable: true, // Lắc lư hạt tuyết khi rơi
                distance: 10,
                speed: 10,
              },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Background & Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c"
          alt="Japanese learning hero background"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
        {/* Lớp phủ để tuyết nổi bật hơn */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-blue-900/40 mix-blend-multiply dark:from-[#0B1120] dark:via-[#0B1120]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent dark:from-[#0f172a]"></div>
      </div>

      {/* Nội dung Content (z-10 để đè lên tuyết) */}
      <div className="relative z-10 max-w-2xl text-white pt-10">
        {/* ... Giữ nguyên phần code hiển thị Title, Badge, Description và Buttons của bạn ... */}
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6 shadow-glow">
          <span className="size-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#F472B6]"></span>
          <span className="text-xs font-bold tracking-wide uppercase text-secondary">
            {t("home.badge")}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 tracking-tight drop-shadow-lg">
          {t("home.title")} <br />
          <span className="text-secondary text-glow">{t("home.easier")}</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 font-light max-w-lg leading-relaxed drop-shadow-md">
          {t("home.description")}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={isMounted && isAuthenticated ? "/course" : "/login"}
            className="bg-secondary hover:bg-pink-400 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all transform hover:translate-y-[-2px] shadow-lg shadow-pink-500/40 flex items-center gap-2"
          >
            {t("home.getStarted")}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          <Button
            variant="ghost"
            className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-base transition-all flex items-center gap-2 hover:border-white/40"
          >
            <span className="material-symbols-outlined">play_circle</span>
            {t("home.watchDemo")}
          </Button>
        </div>
      </div>
    </div>
  );
}