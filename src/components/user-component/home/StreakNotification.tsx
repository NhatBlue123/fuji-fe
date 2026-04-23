"use client";

import { useEffect, useState } from "react";
import { Flame, Target, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakNotificationProps {
  message?: string;
  type?: "success" | "warning" | "info";
  show: boolean;
  onDismiss: () => void;
  progressPercent?: number;
  qualified?: boolean;
  almostQualified?: boolean;
}

export function StreakNotification({
  message,
  type = "info",
  show,
  onDismiss,
  progressPercent = 0,
  qualified = false,
  almostQualified = false,
}: StreakNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const getTypeStyles = () => {
    if (qualified) return "bg-green-500/20 border-green-500/30 text-green-400";
    if (almostQualified) return "bg-orange-500/20 border-orange-500/30 text-orange-400";
    return "bg-blue-500/20 border-blue-500/30 text-blue-400";
  };

  const getIcon = () => {
    if (qualified) return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (almostQualified) return <AlertCircle className="w-5 h-5 text-orange-400" />;
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] max-w-sm rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300",
        getTypeStyles(),
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold">Streak Update</span>
          </div>
          <p className="text-sm opacity-90">{message || "Tiến độ streak của bạn đã thay đổi!"}</p>
          {!qualified && progressPercent > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    qualified ? "bg-green-500" : almostQualified ? "bg-orange-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium">{progressPercent}%</span>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}
