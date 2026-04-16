"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="px-6 md:px-12 lg:px-20 mt-20 mb-20">
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden border border-slate-700 shadow-2xl">
        <div className="absolute -right-20 -top-20 opacity-5 rotate-12 pointer-events-none">
          <span className="material-symbols-outlined text-[300px] text-white">
            filter_vintage
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isMounted ? t("home.cta.title") : t("home.cta.title", { lng: 'vi' })}
          </h2>
          <p className="text-slate-300">
            {isMounted ? t("home.cta.description") : t("home.cta.description", { lng: 'vi' })}
          </p>
        </div>
        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all w-full md:w-auto whitespace-nowrap shadow-lg shadow-blue-500/30">
            {isMounted ? t("home.cta.button") : t("home.cta.button", { lng: 'vi' })}
          </Button>
        </div>
      </div>
    </section>
  );
}
