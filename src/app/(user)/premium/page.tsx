"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PremiumTabs from "@/components/user-component/premium/PremiumTabs";
import PricingCards from "@/components/user-component/premium/PricingCards";
import FeatureGrid from "@/components/user-component/premium/FeatureGrid";
import TopupContent from "@/components/user-component/premium/TopupContent";
import { useTranslation } from "react-i18next";

function PremiumPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = (searchParams.get("tab") as "premium" | "topup") || "premium";

  const handleTabChange = (newTab: "premium" | "topup") => {
    router.replace(`${pathname}?tab=${newTab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-pink-500 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> {t("common.back")}
        </button>
        <PremiumTabs activeTab={tab} onChangeTab={handleTabChange} />

        <div className="mt-8 flex flex-col items-center">
          {tab === "premium" && (
            <>
              <PricingCards />

              <div className="mt-16 w-full">
                <h2 className="text-2xl font-bold text-center mb-8">
                  {t("premium.whyPremium")}
                </h2>
                <FeatureGrid />
              </div>
            </>
          )}

          {tab === "topup" && <TopupContent />}
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">{t("common.loading")}</div>}>
      <PremiumPageContent />
    </Suspense>
  );
}