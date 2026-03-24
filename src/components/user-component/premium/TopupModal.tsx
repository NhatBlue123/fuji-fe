'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import TopupContent from './TopupContent';
// Giả sử bạn đã tách phần Nâng cấp Premium thành component này (như đã hướng dẫn ở các bước trước)
import PremiumPricingContent from './PremiumPricingContent'; 

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TopupModal({ isOpen, onClose }: TopupModalProps) {
  const [activeTab, setActiveTab] = useState<'premium' | 'topup'>('premium');
  if (!isOpen) return null;
  const tabs = [
    { id: 'premium', name: 'Nâng cấp Premium' },
    { id: 'topup', name: 'Nạp Hoa Anh Đào' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background text-foreground rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-border p-8 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Tabs */}
        <div className="border-b border-border flex justify-center mb-10 w-full">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'premium' | 'topup')}
                  className={`px-6 py-4 font-semibold text-lg transition relative whitespace-nowrap
                    ${
                      isActive 
                        ? 'text-secondary'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {tab.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-8">
          {activeTab === 'premium' && <PremiumPricingContent />}
          {activeTab === 'topup' && <TopupContent />}
        </div>
        
      </div>
    </div>
  );
}