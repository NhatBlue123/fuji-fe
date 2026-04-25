"use client";

import { useGetLatestInsightQuery } from "@/store/services/progressApi";
import { StreakCard } from "@/components/user-component/home/StreakCard";
import { ProgressChart } from "@/components/user-component/home/ProgressChart";
import { BarChart3, Headphones, Mic, BookOpen, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillsProgressProps {
  className?: string;
}

export function SkillsProgress({ className }: SkillsProgressProps) {
  const { data: insight, isLoading } = useGetLatestInsightQuery();

  const skills = insight ? [
    { name: "Nghe", level: insight.listeningLevel, icon: Headphones, color: "text-blue-400", bgColor: "bg-blue-500" },
    { name: "Nói", level: insight.speakingLevel, icon: Mic, color: "text-green-400", bgColor: "bg-green-500" },
    { name: "Đọc", level: insight.readingLevel, icon: BookOpen, color: "text-yellow-400", bgColor: "bg-yellow-500" },
    { name: "Viết", level: insight.writingLevel, icon: PenTool, color: "text-pink-400", bgColor: "bg-pink-500" },
  ] : [];

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      {/* Streak Card */}
      <div className="lg:col-span-1">
        <StreakCard className="h-full" />
      </div>

      {/* Progress Chart */}
      <div className="lg:col-span-2">
        <ProgressChart className="h-full" />
      </div>

      {/* Skills Breakdown - Full Width */}
      {!isLoading && skills.length > 0 && (
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-[#1a1d27] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Kỹ năng của bạn</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {skills.map((skill) => {
                const Icon = skill.icon;
                return (
                  <div key={skill.name} className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className={cn("mb-2", skill.color)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-white mb-2">{skill.name}</p>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", skill.bgColor)}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{skill.level}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
