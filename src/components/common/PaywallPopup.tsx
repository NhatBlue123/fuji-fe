import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";

interface PaywallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  requiredTier?: "PRO" | "PREMIUM";
}

export default function PaywallPopup({ 
  isOpen, 
  onClose, 
  title = "Tính năng cao cấp", 
  description = "Tính năng này chỉ dành cho tài khoản nâng cấp. Vui lòng nâng cấp gói để trải nghiệm tốt nhất.",
  requiredTier = "PRO"
}: PaywallPopupProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-pink-500/20 shadow-2xl shadow-pink-500/10 dark:bg-[#0f1218] Backdrop-blur-xl">
        <DialogHeader className="flex flex-col items-center gap-2 pt-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500/10 to-purple-500/10 flex items-center justify-center mb-4 border border-pink-500/20 shadow-inner">
            <Lock className="w-10 h-10 text-pink-500" />
          </div>
          <DialogTitle className="text-2xl font-black text-center uppercase tracking-tighter">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 flex-col sm:flex-col gap-3 pb-2 w-full">
          <Button 
            onClick={() => {
              onClose();
              router.push('/premium');
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black h-14 rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-pink-500/25"
          >
            <Crown className="w-5 h-5 mr-2" />
            Nâng cấp {requiredTier}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full h-12 uppercase tracking-widest text-[10px] font-bold text-muted-foreground hover:bg-white/5"
          >
            Để sau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
