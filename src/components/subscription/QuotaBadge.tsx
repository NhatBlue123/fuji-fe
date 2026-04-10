import React from 'react';

interface QuotaBadgeProps {
  remaining: number;
  limit?: number;
  unlimited?: boolean;
  label: string;
}

export const QuotaBadge: React.FC<QuotaBadgeProps> = ({ remaining, limit, unlimited, label }) => {
  if (unlimited || remaining === -1) {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        {label}: Không giới hạn
      </div>
    );
  }

  const isExhausted = remaining <= 0;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isExhausted ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
      {label}: {isExhausted ? 'Hết lượt' : `Còn ${remaining}${limit && limit !== -1 ? `/${limit}` : ''} lượt`}
    </div>
  );
};
