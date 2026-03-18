"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetMyAttemptsQuery } from "@/store/services/jlptApi";
import type { TestAttemptResult, JLPTLevel } from "@/types/jlpt";
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
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JlptHistoryPage() {
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

  // ── Filtering & sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400_000;
    const cutoffs: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

    return attempts
      .filter((a) => {
        if (selectedLevel !== "Tất cả" && a.test?.level !== selectedLevel)
          return false;
        if (selectedTime !== "all") {
          const cutoff = now - cutoffs[selectedTime] * dayMs;
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
  }, [attempts, selectedLevel, selectedTime, filterResult, sortField, sortDir]);

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

  const SortIcon = ({ field }: { field: "date" | "score" }) =>
    sortField !== field ? (
      <span className="material-symbols-outlined text-[14px] opacity-30">
        swap_vert
      </span>
    ) : sortDir === "desc" ? (
      <span className="material-symbols-outlined text-[14px] text-pink-400">
        arrow_downward
      </span>
    ) : (
      <span className="material-symbols-outlined text-[14px] text-pink-400">
        arrow_upward
      </span>
    );

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400 mb-4" />
          <p>Đang tải lịch sử...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-32 bg-[#0B1120] text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">
            error
          </span>
          <p className="text-lg font-semibold">Không thể tải dữ liệu</p>
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
    <div className="bg-[#0B1120] text-white px-6 md:px-12 lg:px-16 py-10 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Lịch sử thi JLPT
          </h1>
          <p className="text-slate-400 text-sm mt-1">
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
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Đã đậu",
                value: stats.passed,
                icon: "verified",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Tỉ lệ đậu",
                value: `${stats.passRate}%`,
                icon: "percent",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              {
                label: "Điểm cao nhất",
                value: stats.best,
                icon: "emoji_events",
                color: "text-pink-400",
                bg: "bg-pink-500/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-slate-800/60 border border-white/5 p-5 flex items-center gap-4"
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
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Progress Chart ── */}
        {chartData.length >= 2 && (
          <div className="rounded-2xl bg-slate-800/60 border border-white/5 p-6">
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
                <h2 className="text-lg font-bold text-white">
                  Biểu đồ tiến bộ
                </h2>
                <p className="text-xs text-slate-400">
                  {chartData.length} lần thi gần nhất
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 180]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
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
        <div className="rounded-2xl bg-slate-800/60 border border-white/5 p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Level */}
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((lv) => (
              <Button
                key={lv}
                onClick={() => setSelectedLevel(lv)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                  selectedLevel === lv
                    ? "bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/20"
                    : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
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
                    ? "bg-slate-600 border-slate-500 text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
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
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : r === "failed"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-slate-600 border-slate-500 text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {r === "all" ? "Tất cả" : r === "passed" ? "✓ Đậu" : "✗ Trượt"}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl bg-slate-800/60 border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-400">
              history_edu
            </span>
            <h2 className="font-bold text-white">Danh sách lần thi</h2>
            <span className="text-sm font-normal text-slate-400">
              ({filtered.length} kết quả)
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                inbox
              </span>
              <p>Không có kết quả nào phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-semibold">
                      Đề thi
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Level
                    </th>
                    <th
                      className="text-center px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => toggleSort("score")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Tổng điểm <SortIcon field="score" />
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
                      className="text-center px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => toggleSort("date")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Ngày thi <SortIcon field="date" />
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
                      className={`border-b border-white/5 hover:bg-slate-700/30 transition-colors ${
                        idx % 2 === 0 ? "" : "bg-slate-900/20"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white line-clamp-1">
                          {attempt.test?.title || `Bài thi #${attempt.testId}`}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {attempt.totalQuestions} câu •{" "}
                          {attempt.test?.duration ?? "--"} phút
                        </div>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-200 border border-slate-600">
                          {attempt.test?.level ?? "?"}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="text-base font-black text-pink-400">
                          {Number(attempt.totalScore).toFixed(0)}
                        </span>
                        <span className="text-xs text-slate-500">
                          /{attempt.test?.maxScore ?? 180}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4 hidden lg:table-cell text-slate-300">
                        {Number(attempt.languageKnowledgeScore).toFixed(0)}
                      </td>
                      <td className="text-center px-4 py-4 hidden lg:table-cell text-slate-300">
                        {Number(attempt.readingScore).toFixed(0)}
                      </td>
                      <td className="text-center px-4 py-4 hidden lg:table-cell text-slate-300">
                        {Number(attempt.listeningScore).toFixed(0)}
                      </td>
                      <td className="text-center px-4 py-4 hidden sm:table-cell text-slate-400 text-xs">
                        {formatTimeSpent(attempt.timeSpent)}
                      </td>
                      <td className="text-center px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(attempt.startedAt)}
                      </td>
                      <td className="text-center px-4 py-4">
                        {attempt.isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-bold">
                            <span className="material-symbols-outlined text-[12px]">
                              check_circle
                            </span>
                            Đậu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold">
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-all"
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
