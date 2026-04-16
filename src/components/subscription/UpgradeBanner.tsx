import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  feature: string;
  requiredPlan: string;
  message: string;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ feature, requiredPlan, message }) => {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-amber-50 flex-col sm:flex-row flex to-orange-50 border border-amber-200 rounded-xl p-4 sm:items-center justify-between gap-4 w-full dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
      <div className="flex items-start sm:items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-lg dark:bg-amber-900/50">
          <Sparkles className="text-amber-600 w-5 h-5 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-amber-900 font-semibold text-sm mb-0.5 dark:text-amber-100">{feature} (Yêu cầu gói {requiredPlan})</h4>
          <p className="text-amber-700 text-sm dark:text-amber-400">{message}</p>
        </div>
      </div>
      <button 
        onClick={() => router.push('/premium')}
        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow whitespace-nowrap"
      >
        Nâng cấp ngay
      </button>
    </div>
  );
};
