"use client";

import { useEffect } from "react";
import { X, Flame, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakNotificationProps {
  message: string;
  type: "success" | "warning" | "info";
  show: boolean;
  onDismiss: () => void;
  progressPercent?: number;
  qualified?: boolean;
  almostQualified?: boolean;
}

export function StreakNotification({
  message,
  type,
  show,
  onDismiss,
  progressPercent = 0,
  qualified = false,
  almostQualified = false,
}: StreakNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  const getIcon = () => {
    if (qualified) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (almostQualified) return <Flame className="w-5 h-5 text-orange-400" />;
    return <Target className="w-5 h-5 text-blue-400" />;
  };

  const getGlowClass = () => {
    if (qualified) return "shadow-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20";
    if (almostQualified) return "shadow-orange-500/50 bg-gradient-to-r from-orange-500/20 to-red-500/20";
    return "shadow-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10";
  };

  const getBorderClass = () => {
    if (qualified) return "border-yellow-500/50";
    if (almostQualified) return "border-orange-500/50";
    return "border-blue-500/30";
  };

  const getIconBgClass = () => {
    if (qualified) return "bg-yellow-500/20";
    if (almostQualified) return "bg-orange-500/20";
    return "bg-blue-500/20";
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300",
        "max-w-sm w-full"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md",
          "shadow-lg transition-all duration-300",
          getGlowClass(),
          getBorderClass()
        )}
      >
        {/* Progress bar */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
            <div
              className={cn(
                "h-full transition-all duration-500",
                qualified ? "bg-yellow-400" : almostQualified ? "bg-orange-400" : "bg-blue-400"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Success glow effect for qualified */}
        {qualified && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-orange-500/10 animate-pulse" />
        )}

        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex-shrink-0 rounded-xl p-2",
              getIconBgClass()
            )}
          >
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{message}</p>
            
            {progressPercent > 0 && progressPercent < 100 && (
              <p className="text-xs text-white/60 mt-1">
                {progressPercent}% hoàn thành
              </p>
            )}
          </div>

          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-lg transition-colors",
              "hover:bg-white/10 text-white/60 hover:text-white"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
