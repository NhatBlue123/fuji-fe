import React from 'react';
import Link from 'next/link';


interface PremiumTabsProps {
  activeTab: 'premium' | 'topup'; // Xác định tab nào đang hoạt động
}

export default function PremiumTabs({ activeTab }: PremiumTabsProps) {
  
  const tabs = [
    { id: 'premium', label: 'Nâng cấp Premium', href: '/user/premium' },
    { id: 'topup', label: 'Nạp Hoa Anh Đào', href: '/user/topup' },
  ];

  return (
    
    <div className="border-b border-border flex justify-center mb-10 w-full">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <Link key={tab.id} href={tab.href} className="relative group">
              <div
                className={`px-6 py-4 font-semibold text-lg transition-colors duration-200 cursor-pointer whitespace-nowrap
                  ${
                    isActive
                      ? 'text-secondary'                   
                      : 'text-muted-foreground group-hover:text-foreground'
                  }
                `}
              >
                {tab.label}
              </div>
              
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
              )}             
              {!isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}