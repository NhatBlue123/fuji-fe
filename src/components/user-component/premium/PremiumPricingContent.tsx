import React from 'react';
import PricingCards from './PricingCards';
import FeatureGrid from './FeatureGrid';

export default function PremiumPricingContent() {
  return (
    <div className="flex flex-col items-center">
      {/* Component Bảng giá */}
      <PricingCards />

      {/* Component Lý do chọn Premium */}
      <div className="mt-16 w-full">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Tại sao nên chọn Premium?
        </h2>
        <FeatureGrid />
      </div>
    </div>
  );
}