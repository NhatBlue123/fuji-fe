"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/hooks";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative w-full min-h-[680px] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 pb-72 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-blue-900/20">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c"
          alt="Japanese learning hero background"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-blue-900/40 mix-blend-multiply dark:from-[#0B1120] dark:via-[#0B1120]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent dark:from-[#0f172a]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-2xl text-white pt-10">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6 shadow-glow">
          <span className="size-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#F472B6]"></span>
          <span className="text-xs font-bold tracking-wide uppercase text-secondary">
            Nền tảng học tiếng Nhật số 1
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 tracking-tight drop-shadow-lg">
          Học Tiếng Nhật <br />
          <span className="text-secondary text-glow">Dễ Dàng Hơn.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 font-light max-w-lg leading-relaxed drop-shadow-md">
          Chinh phục tiếng Nhật cùng FUJI. Lộ trình cá nhân hóa dành riêng cho
          người Việt với sự hỗ trợ từ AI.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={isAuthenticated ? "/course" : "/login"}
            className="bg-secondary hover:bg-pink-400 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all transform hover:translate-y-[-2px] shadow-lg shadow-pink-500/40 flex items-center gap-2"
          >
            Bắt đầu ngay
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
          <button className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-base transition-all flex items-center gap-2 hover:border-white/40">
            <span className="material-symbols-outlined">play_circle</span>
            Xem demo
          </button>
        </div>
      </div>
    </div>
  );
}
