import React from "react";
import PremiumTabs from "@/components/user-component/premium/PremiumTabs";
import PricingCards from "@/components/user-component/premium/PricingCards";
import FeatureGrid from "@/components/user-component/premium/FeatureGrid";

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <PremiumTabs activeTab="premium" />

        <div className="mt-8 flex flex-col items-center">
          <PricingCards />

          <div className="mt-16 w-full">
            <h2 className="text-2xl font-bold text-center mb-8">
              Tại sao nên chọn Premium?
            </h2>
            <FeatureGrid />
          </div>
        </div>
      </div>
    </div>
  );
}