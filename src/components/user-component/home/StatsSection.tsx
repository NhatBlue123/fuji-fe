import { cn } from "@/lib/utils";

const STAT_STYLES = {
  blue: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/20",
  pink: "bg-pink-500/20 text-pink-600 dark:text-pink-300 border-pink-500/20",
  emerald:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  purple:
    "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/20",
} as const;

type StatColor = keyof typeof STAT_STYLES;

interface Stat {
  icon: string;
  value: string;
  label: string;
  color: StatColor;
}

const STATS: Stat[] = [
  { icon: "groups", value: "10K+", label: "Học viên", color: "blue" },
  { icon: "school", value: "500+", label: "Khóa học", color: "pink" },
  {
    icon: "verified",
    value: "95%",
    label: "Tỷ lệ đỗ JLPT",
    color: "emerald",
  },
  {
    icon: "cast_for_education",
    value: "50+",
    label: "Giảng viên",
    color: "purple",
  },
];

export function StatsSection() {
  return (
    <div className="px-6 md:px-12 lg:px-20 -mt-16 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:bg-slate-100 hover:dark:bg-slate-800/60 transition-colors"
          >
            <div
              className={cn(
                "size-12 rounded-full flex items-center justify-center border",
                STAT_STYLES[stat.color],
              )}
            >
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
