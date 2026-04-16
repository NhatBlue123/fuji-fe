import React from "react";
import { useRouter } from "next/navigation";
import { Crown, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaywallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  requiredTier?: "PRO" | "PREMIUM";
  actionLabel?: string;
  upgradePath?: string;
}

export default function PaywallPopup({
  isOpen,
  onClose,
  title = "Tinh nang cao cap",
  description = "Tinh nang nay chi danh cho tai khoan nang cap. Vui long nang cap goi de tiep tuc su dung.",
  requiredTier = "PRO",
  actionLabel,
  upgradePath = "/premium",
}: PaywallPopupProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-pink-500/20 shadow-2xl shadow-pink-500/10 dark:bg-[#0f1218] backdrop-blur-xl">
        <DialogHeader className="flex flex-col items-center gap-2 pt-6">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-pink-500/20 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 shadow-inner">
            <Lock className="h-10 w-10 text-pink-500" />
          </div>
          <DialogTitle className="text-center text-2xl font-black uppercase tracking-tighter">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 flex-col gap-3 pb-2 sm:flex-col">
          <Button
            onClick={() => {
              onClose();
              router.push(upgradePath);
            }}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-purple-700"
          >
            <Crown className="mr-2 h-5 w-5" />
            {actionLabel || `Nang cap ${requiredTier}`}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-12 w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-white/5"
          >
            Để sau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
