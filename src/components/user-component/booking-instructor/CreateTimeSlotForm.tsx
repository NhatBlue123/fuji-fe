"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { Mode, TimeRange, Weekday } from "./types";
import {
  estimateSlots,
  getWeekdayCodeFromDate,
  hasInvalidRange,
  hasOverlap,
  toBlossom,
} from "./utils";
import TimeRangeList from "./TimeRangeList";
import WeekdayPicker from "./WeekdayPicker";
import PreviewCard from "./PreviewCard";

const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"] as const;

const SUBJECT_OPTIONS = [
  { value: "Kaiwa", label: "Kaiwa" },
  { value: "Từ vựng", label: "Từ vựng" },
  { value: "Ngữ pháp", label: "Ngữ pháp" },
  { value: "Nghe", label: "Nghe" },
] as const;

type LevelOption = (typeof LEVEL_OPTIONS)[number];
type SubjectOption = (typeof SUBJECT_OPTIONS)[number]["value"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function CreateTimeSlotForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("bulk");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [level, setLevel] = useState<LevelOption>("N4");
  const [subjectType, setSubjectType] = useState<SubjectOption>("Kaiwa");
  const [price, setPrice] = useState<number>(50000);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const [daysOfWeek, setDaysOfWeek] = useState<Weekday[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { start: "19:00", end: "20:00" },
  ]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleGoBack = () => {
    router.push("/admin/teacher-schedules/teaching-schedule");
  };

  const composedSubject = useMemo(
    () => `${subjectType} ${level}`.trim(),
    [subjectType, level]
  );

  const blossom = useMemo(() => toBlossom(price), [price]);

  const estimatedSlots = useMemo(() => {
    if (!dateFrom) return 0;
    if (mode === "single") return timeRanges.length;
    return estimateSlots(dateFrom, dateTo, daysOfWeek, timeRanges.length);
  }, [mode, dateFrom, dateTo, daysOfWeek, timeRanges.length]);

  const canSubmit = useMemo(() => {
    if (!dateFrom || !subjectType || !level || !price || price <= 0) return false;
    if (!timeRanges.length) return false;
    if (hasInvalidRange(timeRanges)) return false;
    if (mode === "bulk" && (!dateTo || dateTo < dateFrom || !daysOfWeek.length)) {
      return false;
    }
    return true;
  }, [mode, dateFrom, dateTo, subjectType, level, price, timeRanges, daysOfWeek.length]);

  const toggleDay = (day: Weekday) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addRange = () =>
    setTimeRanges((prev) => [...prev, { start: "08:00", end: "09:00" }]);

  const removeRange = (idx: number) =>
    setTimeRanges((prev) => prev.filter((_, i) => i !== idx));

  const updateRange = (idx: number, patch: Partial<TimeRange>) =>
    setTimeRanges((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const submit = async () => {
    setErr("");
    setNotice(null);

    if (!canSubmit) {
      const message = "Vui lòng điền đủ thông tin hợp lệ trước khi lưu.";
      setErr(message);
      setNotice({
        type: "error",
        title: "Không thể lưu lịch",
        description: message,
      });
      return;
    }

    if (hasOverlap(timeRanges)) {
      const message = "Không thể tạo lịch trùng giờ.";
      setErr(message);
      setNotice({
        type: "error",
        title: "Không thể lưu lịch",
        description: message,
      });
      return;
    }

    try {
      setLoading(true);

      let payload: {
        dateFrom: string;
        dateTo: string;
        daysOfWeek: Weekday[];
        timeRanges: TimeRange[];
        price: number;
        subject: string;
      };

      if (mode === "single") {
        const weekday = getWeekdayCodeFromDate(dateFrom);

        if (!weekday) {
          const message = "Ngày dạy không hợp lệ.";
          setErr(message);
          setNotice({
            type: "error",
            title: "Không thể lưu lịch",
            description: message,
          });
          return;
        }

        payload = {
          dateFrom,
          dateTo: dateFrom,
          daysOfWeek: [weekday],
          timeRanges,
          price,
          subject: composedSubject,
        };
      } else {
        payload = {
          dateFrom,
          dateTo,
          daysOfWeek,
          timeRanges,
          price,
          subject: composedSubject,
        };
      }

      await api.post("/time-slots/bulk", payload);
      router.push("/admin/teacher-schedules/teaching-schedule");
    } catch (e: any) {
      const message = e?.response?.data?.message || "Tạo lịch thất bại.";
      setErr(message);
      setNotice({
        type: "error",
        title: "Không thể lưu lịch",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex-1 overflow-y-auto bg-background p-0 text-foreground">
      <div className="absolute right-0 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[320px] w-[320px] rounded-full bg-primary/20 blur-[100px]" />

      {notice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              notice.type === "success"
                ? "border-chart-4/40 bg-card"
                : "border-destructive/50 bg-card"
            }`}
          >
            <h3 className="text-xl font-bold text-foreground">{notice.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{notice.description}</p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="h-10 rounded-xl bg-secondary px-6 font-semibold text-secondary-foreground hover:bg-secondary/90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid w-full grid-cols-1 gap-0 xl:grid-cols-3 xl:gap-6">
        <section className="glass-card rounded-none border border-border border-l-0 border-t-0 p-6 xl:col-span-2 xl:rounded-2xl xl:border-l xl:border-t md:p-8">
          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>

            <h1 className="text-3xl font-black tracking-tight">Tạo lịch giảng dạy</h1>
          </div>

          <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setMode("single")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "single"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Một buổi
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "bulk"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lịch lặp
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={mode === "single" ? "Ngày dạy" : "Ngày bắt đầu"}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              />
            </Field>

            {mode === "bulk" ? (
              <Field label="Ngày kết thúc">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                />
              </Field>
            ) : (
              <Field label="Cấp độ JLPT">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelOption)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                >
                  {LEVEL_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {mode === "bulk" ? (
            <div className="mt-6">
              <WeekdayPicker value={daysOfWeek} onToggle={toggleDay} />
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "bulk" ? (
              <Field label="Cấp độ JLPT">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelOption)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                >
                  {LEVEL_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label="Môn học">
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as SubjectOption)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              >
                {SUBJECT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <TimeRangeList
              ranges={timeRanges}
              onAdd={addRange}
              onRemove={removeRange}
              onChange={updateRange}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Chủ đề">
              <div className="flex h-12 items-center rounded-xl border border-border bg-card/60 px-4 font-semibold text-foreground">
                {composedSubject}
              </div>
            </Field>

            <Field label="Học phí (VND)">
              <input
                type="number"
                min={1000}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              />
            </Field>

            <Field label="Quy đổi">
              <div className="flex h-12 items-center rounded-xl border border-primary/40 bg-primary/10 px-4 font-semibold text-foreground">
                ≈ {blossom} 🌸
              </div>
            </Field>
          </div>

          {err ? (
            <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {err}
            </div>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="h-12 rounded-xl border border-border bg-card px-6 font-semibold hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="h-12 rounded-xl bg-secondary px-8 font-bold text-secondary-foreground disabled:opacity-50 hover:bg-secondary/90"
            >
              {loading ? "Đang lưu..." : "Lưu lịch rảnh"}
            </button>
          </div>
        </section>

        <PreviewCard
          mode={mode}
          subject={composedSubject}
          price={price}
          ranges={timeRanges}
          estimatedSlots={estimatedSlots}
        />
      </div>
    </main>
  );
}
