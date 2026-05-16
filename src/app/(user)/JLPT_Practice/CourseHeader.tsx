import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const JLPT_PRACTICE_HERO_IMAGE = "/images/a81f5eef-99c1-44bd-9b66-ed87f9a8c40a.png";

export default function CourseHeader() {
  const { t } = useTranslation();

  return (
    <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-secondary/10">
      {/* Background overlay */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${JLPT_PRACTICE_HERO_IMAGE}')`,
          }}
        />
      </div>
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0B1120]/80 via-[#0B1120]/50 to-transparent" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
              {t("jlpt.practice.headerTitle", { defaultValue: "Luy\u1EC7n thi" })}{" "}
              <span className="text-secondary text-glow">JLPT</span>
            </h1>
            <p className="text-white/95 text-lg md:text-xl font-semibold max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
              {t("jlpt.practice.headerSubtitle", { defaultValue: "\u0110\u1EC1 thi m\u00F4 ph\u1ECFng s\u00E1t k\u1EF3 thi th\u1EADt. Chinh ph\u1EE5c JLPT t\u1EEB N5 \u0111\u1EBFn N1." })}
            </p>
          </div>

          {/* Nút Lịch sử thi — góc trên phải */}
          <Link
            href="/jlpt/history"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-white text-sm font-semibold transition-all shadow-sm shrink-0 mt-1"
          >
            <span
              className="material-symbols-outlined text-[18px] text-pink-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history_edu
            </span>
            {t("jlpt.practice.historyButton", { defaultValue: "L\u1ECBch s\u1EED thi" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
