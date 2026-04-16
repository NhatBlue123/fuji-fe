"use client";

import { useTranslation } from "react-i18next";
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
  toVnd,
} from "./utils";
import TimeRangeList from "./TimeRangeList";
import WeekdayPicker from "./WeekdayPicker";
import PreviewCard from "./PreviewCard";

const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"] as const;
type LevelOption = (typeof LEVEL_OPTIONS)[number];

const SUBJECT_OPTIONS = (t: any) => [
  { value: "Kaiwa", label: t("booking.subject.kaiwa") },
  { value: "Bunpo", label: t("booking.subject.bunpo") },
  { value: "Kanji", label: t("booking.subject.kanji") },
  { value: "Listening", label: t("booking.subject.listening") },
  { value: "Reading", label: t("booking.subject.reading") },
] as const;
type SubjectOption = ReturnType<typeof SUBJECT_OPTIONS>[number]["value"];

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
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("bulk");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [level, setLevel] = useState<LevelOption | "">("");
  const [subjectType, setSubjectType] = useState<SubjectOption | "">("");
  const [price, setPrice] = useState<number>(50);

  const [notice, setNotice] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    description: string;
    onClose?: () => void;
  } | null>(null);

  const [daysOfWeek, setDaysOfWeek] = useState<Weekday[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { start: "19:00", end: "20:00" },
  ]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const composedSubject = subjectType && level ? `${subjectType} - ${level}` : "";

  const handleGoBack = () => {
    router.push("/admin/teacher-schedules/teaching-schedule");
  };

  const transferVnd = useMemo(() => toVnd(price), [price]);

  const estimatedSlots = useMemo(() => {
    if (!dateFrom) return 0;
    if (mode === "single") return timeRanges.length;
    return estimateSlots(dateFrom, dateTo, daysOfWeek, timeRanges.length);
  }, [mode, dateFrom, dateTo, daysOfWeek, timeRanges.length]);

  const canSubmit = useMemo(() => {
    if (!dateFrom || !subjectType || !level || !price || price <= 0)
      return false;
    if (!timeRanges.length) return false;
    if (hasInvalidRange(timeRanges)) return false;
    if (mode === "bulk" && (!dateTo || dateTo < dateFrom || !daysOfWeek.length))
      return false;
    return true;
  }, [
    mode,
    dateFrom,
    dateTo,
    subjectType,
    level,
    price,
    timeRanges,
    daysOfWeek.length,
  ]);

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

  const submit = async () => {
    setErr("");
    setNotice(null);

    if (!canSubmit) {
      const message = t("booking.error.fillAll");
      setErr(message);
      setNotice({
        type: "error",
        title: t("booking.error.saveFailed"),
        description: message,
      });
      return;
    }

    if (hasOverlap(timeRanges)) {
      const message = t("booking.error.overlap");
      setErr(message);
      setNotice({
        type: "error",
        title: t("booking.error.saveFailed"),
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
          const message = t("booking.error.invalidDate");
          setErr(message);
          setNotice({
            type: "error",
            title: t("booking.error.saveFailed"),
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

      const { data: res } = await api.post("/time-slots/bulk", payload);
      const bulk = res?.data as {
        requested: number;
        created: number;
        skipped: number;
        conflicts: { startAt: string; endAt: string; reason: string }[];
      } | undefined;

      const created = bulk?.created ?? 0;
      const skipped = bulk?.skipped ?? 0;
      const goToSchedule = () =>
        router.push("/admin/teacher-schedules/teaching-schedule");

      if (!bulk || skipped === 0) {
        setNotice({
          type: "success",
          title: t("booking.success.createTitle"),
          description: t("booking.success.createDesc", { count: created || estimatedSlots }),
          onClose: goToSchedule,
        });
        return;
      }

      if (created === 0) {
        setNotice({
          type: "error",
          title: t("booking.error.allSkippedTitle"),
          description: t("booking.error.allSkippedDesc", { count: skipped }),
        });
      } else {
        setNotice({
          type: "warning",
          title: t("booking.warning.someSkippedTitle"),
          description: t("booking.warning.someSkippedDesc", { created, skipped }),
          onClose: goToSchedule,
        });
      }
    } catch (e: unknown) {
      const message =
        (e as any)?.response?.data?.message || t("booking.error.createFailed");
      setErr(message);
      setNotice({
        type: "error",
        title: t("booking.error.saveFailed"),
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              notice.type === "success"
                ? "bg-card border-chart-4/40"
                : notice.type === "warning"
                  ? "bg-card border-yellow-500/50"
                  : "bg-card border-destructive/50"
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === "success" && (
                <span className="text-2xl">&#10003;</span>
              )}
              {notice.type === "warning" && (
                <span className="text-2xl text-yellow-500">&#9888;</span>
              )}
              {notice.type === "error" && (
                <span className="text-2xl text-destructive">&#10007;</span>
              )}
              <h3 className="text-xl font-bold text-foreground">
                {notice.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {notice.description}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const cb = notice.onClose;
                  setNotice(null);
                  cb?.();
                }}
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
              {t("common.back")}
            </button>
            <h1 className="text-3xl font-black tracking-tight">
              {t("booking.createTitle")}
            </h1>
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
              {t("booking.mode.single")}
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "bulk"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("booking.mode.bulk")}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={mode === "single" ? t("booking.date") : t("booking.dateFrom")}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              />
            </Field>

            {mode === "bulk" ? (
              <Field label={t("booking.dateTo")}>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                />
              </Field>
            ) : (
              <Field label={t("booking.jlptLevel")}>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelOption)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                >
                  <option value="" disabled>{t('auto.booking_slot_1')}</option>
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
              <Field label={t("booking.jlptLevel")}>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelOption)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                >
                  <option value="" disabled>{t('auto.booking_slot_2')}</option>
                  {LEVEL_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label={t("booking.subjectTitle")}>
              <select
                value={subjectType}
                onChange={(e) =>
                  setSubjectType(e.target.value as SubjectOption)
                }
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              >
                <option value="" disabled>{t('auto.booking_slot_3')}</option>
                {SUBJECT_OPTIONS(t).map((item) => (
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
            <Field label={t("booking.topic")}>
              <div className="flex h-12 items-center rounded-xl border border-border bg-card/60 px-4 font-semibold text-foreground">
                {composedSubject || <span className="text-muted-foreground font-normal">{t('auto.booking_slot_4')}</span>}
              </div>
            </Field>

            <Field label={t("booking.tuition")}>
              <input
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
              />
            </Field>

            <Field label={t("booking.conversion")}>
              <div className="h-12 rounded-xl border border-primary/40 bg-primary/10 px-4 flex items-center text-foreground font-semibold">
                ≈ {transferVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')}đ
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
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="h-12 rounded-xl bg-secondary px-8 font-bold text-secondary-foreground disabled:opacity-50 hover:bg-secondary/90"
            >
              {loading ? t("common.saving") : t("booking.btn.save")}
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
