"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OfflinePage() {
  const [dots, setDots] = useState(".");

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(id);
  }, []);

  // Auto-reload when connection is restored
  useEffect(() => {
    const handleOnline = () => window.location.reload();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Icon */}
        <div className="mb-8 relative">
          <div className="size-28 rounded-full bg-muted border border-border flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-6xl text-muted-foreground/60">
              wifi_off
            </span>
          </div>
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-secondary/30 animate-ping" />
        </div>

        {/* Sakura decoration */}
        <div className="mb-4 flex items-center gap-2 text-secondary/70 text-lg">
          <span>🌸</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            FUJI
          </span>
          <span>🌸</span>
        </div>

        <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">
          Mất kết nối mạng
        </h1>

        <p className="text-muted-foreground leading-relaxed mb-2">
          Có vẻ như bạn đang offline. Kiểm tra lại kết nối Wi-Fi hoặc dữ liệu
          di động của bạn.
        </p>

        <p className="text-sm text-muted-foreground/60 mb-8">
          Trang sẽ tự động tải lại khi có mạng trở lại{dots}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 hover:shadow-secondary/40 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Thử lại
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Trang chủ
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-10 w-full rounded-2xl border border-border bg-card/50 p-5 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gợi ý
          </p>
          {[
            { icon: "wifi", text: "Kiểm tra kết nối Wi-Fi của bạn" },
            { icon: "signal_cellular_alt", text: "Bật/tắt dữ liệu di động" },
            { icon: "router", text: "Khởi động lại router nếu cần" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="material-symbols-outlined text-base text-secondary/70">
                {icon}
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
