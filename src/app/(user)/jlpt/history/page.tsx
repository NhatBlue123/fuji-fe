"use client";

import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useGetMyAttemptsQuery } from "@/store/services/jlptApi";
import type { JLPTLevel } from "@/types/jlpt";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEVELS: (JLPTLevel | "Tất cả")[] = [
  "Tất cả",
  "N1",
  "N2",
  "N3",
  "N4",
  "N5",
];
const TIME_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "7 ngày qua", value: "7d" },
  { label: "30 ngày qua", value: "30d" },
  { label: "3 tháng qua", value: "90d" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}
function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function formatTimeSpent(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
type HistoryTooltipPayload = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number | ReadonlyArray<string | number>;
};

type HistoryTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<HistoryTooltipPayload>;
  label?: string | number;
};

const CustomTooltip = ({ active, payload, label }: HistoryTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm text-foreground shadow-xl dark:border-slate-700 dark:bg-[#1a2540] dark:text-white">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {String(p.value ?? "")}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JlptHistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: attempts = [], isLoading, error } = useGetMyAttemptsQuery();

  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "Tất cả">(
    "Tất cả",
  );
  const [selectedTime, setSelectedTime] = useState("all");
  const [filterResult, setFilterResult] = useState<"all" | "passed" | "failed">(
    "all",
  );
  const [sortField, setSortField] = useState<"date" | "score">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [renderedAtMs] = useState(() => Date.now());

  // ── Filtering & sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const dayMs = 86400_000;
    const cutoffs: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

    return attempts
      .filter((a) => {
        if (selectedLevel !== "Tất cả" && a.test?.level !== selectedLevel)
          return false;
        if (selectedTime !== "all") {
          const cutoff = renderedAtMs - cutoffs[selectedTime] * dayMs;
          if (new Date(a.startedAt).getTime() < cutoff) return false;
        }
        if (filterResult === "passed" && !a.isPassed) return false;
        if (filterResult === "failed" && a.isPassed) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortField === "date") {
          const diff =
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
          return sortDir === "desc" ? diff : -diff;
        } else {
          const diff = b.totalScore - a.totalScore;
          return sortDir === "desc" ? diff : -diff;
        }
      });
  }, [attempts, selectedLevel, selectedTime, filterResult, sortField, sortDir, renderedAtMs]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const total = attempts.length;
    const passed = attempts.filter((a) => a.isPassed).length;
    const best = Math.max(...attempts.map((a) => Number(a.totalScore)));
    return {
      total,
      passed,
      passRate: Math.round((passed / total) * 100),
      best,
    };
  }, [attempts]);

  // ── Chart data (last 15 attempts, chronological) ───────────────────────────
  const chartData = useMemo(() => {
    const sorted = [...attempts]
      .sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      )
      .slice(-15);
    return sorted.map((a, i) => ({
      name: `#${i + 1} (${formatShortDate(a.startedAt)})`,
      "Tổng điểm": Number(a.totalScore),
      "Từ vựng/NGP": Number(a.languageKnowledgeScore),
      "Đọc hiểu": Number(a.readingScore),
      "Nghe hiểu": Number(a.listeningScore),
    }));
  }, [attempts]);

  const toggleSort = (field: "date" | "score") => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (field: "date" | "score") =>
    sortField !== field ? (
      <span className="material-symbols-outlined text-[14px] opacity-30">
        swap_vert
      </span>
    ) : sortDir === "desc" ? (
      <span className="material-symbols-outlined text-[14px] text-pink-500 dark:text-pink-400">
        arrow_downward
      </span>
    ) : (
      <span className="material-symbols-outlined text-[14px] text-pink-500 dark:text-pink-400">
        arrow_upward
      </span>
    );

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-background py-32 text-foreground dark:bg-[#0B1120] dark:text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400 mb-4" />
          <p>{t('auto.jlpt_history_page_1')}</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center bg-background py-32 text-foreground dark:bg-[#0B1120] dark:text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">
            error
          </span>
          <p className="text-lg font-semibold">{t('auto.jlpt_history_page_2')}</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 px-5 py-2 bg-pink-500 rounded-lg"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background px-6 py-10 text-foreground dark:bg-[#0B1120] dark:text-white md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div>
          <button
            onClick={() => router.back()}
            className="group mb-3 flex items-center gap-2 font-bold text-muted-foreground transition-all hover:text-pink-500 dark:text-slate-400 dark:hover:text-pink-400"
          >
            <div className="rounded-xl border border-border bg-card/70 p-2 transition-all group-hover:border-pink-500/20 group-hover:bg-pink-500/10 dark:border-white/10 dark:bg-white/5">
              <ArrowLeft size={18} />
            </div>
            Quay lại
          </button>
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Lịch sử thi JLPT
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toàn bộ kết quả các lần làm bài của bạn
          </p>
        </div>

        {/* ── Summary Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Tổng lần thi",
                value: stats.total,
                icon: "assignment",
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Đã đậu",
                value: stats.passed,
                icon: "verified",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Tỉ lệ đậu",
                value: `${stats.passRate}%`,
                icon: "percent",
                color: "text-amber-600 dark:text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              {
                label: "Điểm cao nhất",
                value: stats.best,
                icon: "emoji_events",
                color: "text-pink-600 dark:text-pink-400",
                bg: "bg-pink-500/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm shadow-slate-200/70 dark:border-white/5 dark:bg-slate-800/60 dark:shadow-none"
              >
                <div className={`${s.bg} p-3 rounded-xl`}>
                  <span
                    className={`material-symbols-outlined ${s.color} text-2xl`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {s.icon}
                  </span>
                </div>
                <div>
                  <div className={`text-2xl font-black ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Progress Chart ── */}
        {chartData.length >= 2 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-slate-200/70 dark:border-white/5 dark:bg-slate-800/60 dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <span
                  className="material-symbols-outlined text-pink-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  trending_up
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  Biểu đồ tiến bộ
                </h2>
                <p className="text-xs text-muted-foreground">
                  {chartData.length} lần thi gần nhất
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 180]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <ReferenceLine
                  y={100}
                  stroke="#f59e0b"
                  strokeDasharray="4 2"
                  label={{ value: "Điểm đậu", fill: "#f59e0b", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tổng điểm"
                  stroke="#f472b6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f472b6" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Từ vựng/NGP"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="Đọc hiểu"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="Nghe hiểu"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col flex-wrap gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-slate-200/70 dark:border-white/5 dark:bg-slate-800/60 dark:shadow-none sm:flex-row">
          {/* Level */}
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((lv) => (
              <Button
                key={lv}
                onClick={() => setSelectedLevel(lv)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                  selectedLevel === lv
                    ? "bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/20"
                    : "border-border bg-background text-muted-foreground hover:border-slate-300 hover:bg-muted/60 hover:text-foreground dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                }`}
              >
                {lv}
              </Button>
            ))}
          </div>

          {/* Time */}
          <div className="flex gap-2 flex-wrap sm:ml-auto">
            {TIME_FILTERS.map((tf) => (
              <Button
                key={tf.value}
                onClick={() => setSelectedTime(tf.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedTime === tf.value
                    ? "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    : "border-border bg-background text-muted-foreground hover:border-slate-300 hover:bg-muted/60 hover:text-foreground dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Pass/fail */}
          <div className="flex gap-2">
            {(["all", "passed", "failed"] as const).map((r) => (
              <Button
                key={r}
                onClick={() => setFilterResult(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterResult === r
                    ? r === "passed"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : r === "failed"
                        ? "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400"
                        : "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    : "border-border bg-background text-muted-foreground hover:border-slate-300 hover:bg-muted/60 hover:text-foreground dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {r === "all" ? "Tất cả" : r === "passed" ? "✓ Đậu" : "✗ Trượt"}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-slate-200/70 dark:border-white/5 dark:bg-slate-800/60 dark:shadow-none">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4 dark:border-white/5">
            <span className="material-symbols-outlined text-pink-400">
              history_edu
            </span>
            <h2 className="font-bold text-foreground dark:text-white">{t('auto.jlpt_history_page_3')}</h2>
            <span className="text-sm font-normal text-muted-foreground">
              ({filtered.length} kết quả)
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                inbox
              </span>
              <p>{t('auto.jlpt_history_page_4')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground dark:border-white/5 dark:text-slate-400">
                    <th className="text-left px-6 py-3 font-semibold">
                      Đề thi
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Level
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 text-center font-semibold transition-colors hover:text-foreground dark:hover:text-white"
                      onClick={() => toggleSort("score")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Tổng điểm {renderSortIcon("score")}
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">
                      Từ vựng/NGP
                    </th>
                    <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">
                      Đọc hiểu
                    </th>
                    <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">
                      Nghe hiểu
                    </th>
                    <th className="text-center px-4 py-3 font-semibold hidden sm:table-cell">
                      Thời gian
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 text-center font-semibold transition-colors hover:text-foreground dark:hover:text-white"
                      onClick={() => toggleSort("date")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Ngày thi {renderSortIcon("date")}
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Kết quả
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((attempt, idx) => (
                    <tr
                      key={attempt.id}
                      className={`border-b border-border transition-colors hover:bg-muted/60 dark:border-white/5 dark:hover:bg-slate-700/30 ${
                        idx % 2 === 0 ? "" : "bg-muted/30 dark:bg-slate-900/20"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="line-clamp-1 font-semibold text-foreground dark:text-white">
                          {attempt.test?.title || `Bài thi #${attempt.testId}`}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {attempt.totalQuestions} câu •{" "}
                          {attempt.test?.duration ?? "--"} phút
                        </div>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {attempt.test?.level ?? "?"}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="text-base font-black text-pink-600 dark:text-pink-400">
                          {Number(attempt.totalScore).toFixed(0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /{attempt.test?.maxScore ?? 180}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-center text-foreground/80 dark:text-slate-300 lg:table-cell">
                        {Number(attempt.languageKnowledgeScore).toFixed(0)}
                      </td>
                      <td className="hidden px-4 py-4 text-center text-foreground/80 dark:text-slate-300 lg:table-cell">
                        {Number(attempt.readingScore).toFixed(0)}
                      </td>
                      <td className="hidden px-4 py-4 text-center text-foreground/80 dark:text-slate-300 lg:table-cell">
                        {Number(attempt.listeningScore).toFixed(0)}
                      </td>
                      <td className="hidden px-4 py-4 text-center text-xs text-muted-foreground sm:table-cell">
                        {formatTimeSpent(attempt.timeSpent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center text-xs text-muted-foreground">
                        {formatDate(attempt.startedAt)}
                      </td>
                      <td className="text-center px-4 py-4">
                        {attempt.isPassed ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <span className="material-symbols-outlined text-[12px]">
                              check_circle
                            </span>
                            Đậu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400">
                            <span className="material-symbols-outlined text-[12px]">
                              cancel
                            </span>
                            Trượt
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/jlpt/result?attemptId=${attempt.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted/80 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            open_in_new
                          </span>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
