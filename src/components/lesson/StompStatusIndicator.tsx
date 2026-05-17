"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeStompConnectionState, type StompConnectionState } from "@/lib/stomp";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StompStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  StompConnectionState,
  {
    label: string;
    labelVi: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    tooltip: string;
    tooltipVi: string;
  }
> = {
  CONNECTING: {
    label: "Connecting",
    labelVi: "Đang kết nối",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
    tooltip: "Real-time connection is being established...",
    tooltipVi: "Đang thiết lập kết nối real-time...",
  },
  CONNECTED: {
    label: "Connected",
    labelVi: "Đã kết nối",
    icon: <Wifi className="h-3 w-3" />,
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-400/20 dark:ring-0",
    tooltip: "Real-time connection active. Chat, whiteboard, quiz sync in real-time.",
    tooltipVi: "Kết nối real-time hoạt động. Chat, whiteboard, quiz đồng bộ ngay.",
  },
  DISCONNECTED: {
    label: "Disconnected",
    labelVi: "Mất kết nối",
    icon: <WifiOff className="h-3 w-3" />,
    color: "text-[#8B8FA8]",
    bgColor: "bg-[#8B8FA8]/20",
    tooltip: "Real-time disconnected. Auto-reconnecting...",
    tooltipVi: "Mất kết nối real-time. Đang tự kết nối lại...",
  },
  ERROR: {
    label: "Error",
    labelVi: "Lỗi kết nối",
    icon: <AlertCircle className="h-3 w-3" />,
    color: "text-red-400",
    bgColor: "bg-red-400/20",
    tooltip: "Real-time connection error. Check network or refresh the page.",
    tooltipVi: "Lỗi kết nối real-time. Kiểm tra mạng hoặc tải lại trang.",
  },
};

export function StompStatusIndicator({
  className,
  showLabel = false,
  compact = false,
}: StompStatusIndicatorProps) {
  const [state, setState] = useState<StompConnectionState>("DISCONNECTED");

  useEffect(() => {
    const unsubscribe = subscribeStompConnectionState((s) => {
      setState(s);
    });
    return unsubscribe;
  }, []);

  const config = STATUS_CONFIG[state];
  const isProblem = state === "DISCONNECTED" || state === "ERROR";

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center h-5 w-5 rounded-full",
              config.bgColor,
              config.color,
              className
            )}
          >
            {config.icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p className="font-medium">{config.tooltipVi}</p>
          <p className="text-muted-foreground mt-1">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-default",
            config.bgColor,
            config.color,
            isProblem && "animate-pulse",
            className
          )}
        >
          {config.icon}
          {showLabel && <span>{config.labelVi}</span>}
          {isProblem && (
            <button
              onClick={() => window.location.reload()}
              className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
              title="Reload page"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        <p className="font-medium">{config.tooltipVi}</p>
        <p className="text-muted-foreground mt-1">{config.tooltip}</p>
        <p className="text-muted-foreground mt-1 text-[10px] opacity-70">
          Debug: add ?stompDebug=1 to URL
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
