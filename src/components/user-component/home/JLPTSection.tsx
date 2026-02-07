import { cn } from "@/lib/utils";

const JLPT_LEVELS = [
  { level: "N5", color: "blue", time: "105", tests: 3, icon: "timer" },
  { level: "N4", color: "emerald", time: "125", tests: 5, icon: "assignment" },
  {
    level: "N3",
    color: "purple",
    time: "140",
    tests: 7,
    icon: "psychology",
  },
  {
    level: "N2",
    color: "red",
    time: "155",
    tests: 9,
    icon: "workspace_premium",
  },
] as const;

const LEVEL_STYLES = {
  blue: "hover:border-blue-500/50 bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600",
  emerald:
    "hover:border-emerald-500/50 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600",
  purple:
    "hover:border-purple-500/50 bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600",
  red: "hover:border-red-500/50 bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600",
} as const;

const ICON_STYLES = {
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  purple: "text-purple-500",
  red: "text-red-500",
} as const;

export function JLPTSection() {
  return (
    <section className="px-6 md:px-12 lg:px-20 mt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">flag</span>
            Luyện thi JLPT thực chiến
          </h2>
          <p className="text-muted-foreground dark:text-slate-400 mt-1">
            Bộ đề thi sát với thực tế từ N5 đến N1
          </p>
        </div>
        <a
          className="hidden md:flex items-center gap-1 text-primary dark:text-blue-400 font-bold hover:text-blue-300 transition-colors"
          href="#"
        >
          Kho đề thi{" "}
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {JLPT_LEVELS.map((item) => (
          <div
            key={item.level}
            className={cn(
              "group relative bg-card dark:bg-[#1E293B] border border-border dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:-translate-y-1 overflow-hidden",
              LEVEL_STYLES[item.color],
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span
                className={cn(
                  "material-symbols-outlined text-6xl",
                  ICON_STYLES[item.color],
                )}
              >
                {item.icon}
              </span>
            </div>
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center mb-4",
                LEVEL_STYLES[item.color].split(" ")[2],
                LEVEL_STYLES[item.color].split(" ")[3],
              )}
            >
              <span className="font-bold">{item.level}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-1">
              Đề thi thử {item.level}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
              {item.tests} đề • {item.time} phút/đề
            </p>
            <button className="w-full py-2 rounded-lg bg-muted dark:bg-slate-800 hover:bg-current hover:text-white text-foreground dark:text-white text-sm font-medium transition-colors border border-border dark:border-slate-700 hover:border-current">
              Làm bài ngay
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
