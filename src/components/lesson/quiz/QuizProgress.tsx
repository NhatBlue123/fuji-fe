"use client";

import { cn } from "@/lib/utils";

interface QuizProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function QuizProgress({ current, total, className }: QuizProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#8B8FA8]">
          Câu hỏi <span className="text-[#F0F0F0] font-medium">{current}</span> / {total}
        </span>
        <span className="text-[#6C63FF] font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="h-1.5 bg-[#252838] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8B83FF] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
