"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { BulkResponse, Mode, TimeRange, Weekday } from "./types";
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export default function CreateTimeSlotForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("bulk");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [subject, setSubject] = useState("Kaiwa N4");
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

  const blossom = useMemo(() => toBlossom(price), [price]);

  const estimatedSlots = useMemo(() => {
    if (!dateFrom) return 0;
    if (mode === "single") return timeRanges.length;
    return estimateSlots(dateFrom, dateTo, daysOfWeek, timeRanges.length);
  }, [mode, dateFrom, dateTo, daysOfWeek, timeRanges.length]);

  const canSubmit = useMemo(() => {
    if (!dateFrom || !subject.trim() || !price || price <= 0) return false;
    if (!timeRanges.length) return false;
    if (hasInvalidRange(timeRanges)) return false;
    if (mode === "bulk" && (!dateTo || dateTo < dateFrom || !daysOfWeek.length))
      return false;
    return true;
  }, [mode, dateFrom, dateTo, subject, price, timeRanges, daysOfWeek.length]);

  const toggleDay = (day: Weekday) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const addRange = () =>
    setTimeRanges((prev) => [...prev, { start: "08:00", end: "09:00" }]);
  const removeRange = (idx: number) =>
    setTimeRanges((prev) => prev.filter((_, i) => i !== idx));
  const updateRange = (idx: number, patch: Partial<TimeRange>) =>
    setTimeRanges((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );

  const closeNotice = () => setNotice(null);

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

      let payload: any;
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
          subject,
        };
      } else {
        payload = {
          dateFrom,
          dateTo,
          daysOfWeek,
          timeRanges,
          price,
          subject,
        };
      }

      const res = await api.post("/time-slots/bulk", payload);
      const data: BulkResponse | undefined = res?.data?.data;

      const description = data ? `Tạo lịch thành công` : "Tạo lịch thành công.";

      setNotice({
        type: "success",
        title: "Đã lưu lịch rảnh",
        description,
      });

      setTimeout(() => setNotice(null), 4000);
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
    <main className="flex-1 min-h-screen overflow-y-auto bg-background text-foreground relative p-0">
      <div className="absolute top-0 right-0 -z-10 w-[420px] h-[420px] bg-secondary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[320px] h-[320px] bg-primary/20 rounded-full blur-[100px]" />

      {/* Notice Popup */}
      {notice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              notice.type === "success"
                ? "bg-card border-chart-4/40"
                : "bg-card border-destructive/50"
            }`}
          >
            <h3 className="text-xl font-bold text-foreground">
              {notice.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {notice.description}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="h-10 px-6 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-0 xl:gap-6">
        <section className="xl:col-span-2 glass-card rounded-none xl:rounded-2xl border border-border border-l-0 border-t-0 xl:border-l xl:border-t p-6 md:p-8">
          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <h1 className="text-3xl font-black tracking-tight">
              Tạo lịch giảng dạy
            </h1>
          </div>

          <div className="mt-6 inline-flex rounded-xl p-1 bg-card border border-border">
            <button
              onClick={() => setMode("single")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "single"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Một buổi
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "bulk"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lịch lặp
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={mode === "single" ? "Ngày dạy" : "Ngày bắt đầu"}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
              />
            </Field>

            {mode === "bulk" ? (
              <Field label="Ngày kết thúc">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                />
              </Field>
            ) : (
              <Field label="Môn học">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                />
              </Field>
            )}
          </div>

          {mode === "bulk" ? (
            <div className="mt-6">
              <WeekdayPicker value={daysOfWeek} onToggle={toggleDay} />
            </div>
          ) : null}

          <div className="mt-6">
            <TimeRangeList
              ranges={timeRanges}
              onAdd={addRange}
              onRemove={removeRange}
              onChange={updateRange}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === "bulk" ? (
              <Field label="Môn học">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                />
              </Field>
            ) : null}

            <Field label="Học phí (VND)">
              <input
                type="number"
                min={1000}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
              />
            </Field>

            <Field label="Quy đổi">
              <div className="h-12 rounded-xl border border-primary/40 bg-primary/10 px-4 flex items-center text-foreground font-semibold">
                ≈ {blossom} �
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
              className="h-12 px-6 rounded-xl border border-border bg-card hover:bg-muted font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="h-12 px-8 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu lịch rảnh"}
            </button>
          </div>
        </section>

        <PreviewCard
          mode={mode}
          subject={subject}
          price={price}
          ranges={timeRanges}
          estimatedSlots={estimatedSlots}
        />
      </div>
    </main>
  );
}
