"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  Clock3,
  Sparkles,
 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useGetTeacherAvailabilityQuery, useGetMyBusySlotsQuery } from "@/store/services/bookingApi";
import type { DiscoverySlot } from "@/types/booking";

const WEEKDAY_OPTIONS = [
  { value: 1, label: "T2", full: "Thứ 2" },
  { value: 2, label: "T3", full: "Thứ 3" },
  { value: 3, label: "T4", full: "Thứ 4" },
  { value: 4, label: "T5", full: "Thứ 5" },
  { value: 5, label: "T6", full: "Thứ 6" },
  { value: 6, label: "T7", full: "Thứ 7" },
  { value: 0, label: "CN", full: "Chủ nhật" },
] as const;

function toYmd(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addDaysLocal(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateRange(fromDate: string, toDate: string) {
  return `${parseLocalDate(fromDate).toLocaleDateString("vi-VN")} - ${parseLocalDate(
    toDate
  ).toLocaleDateString("vi-VN")}`;
}

function formatFullDate(date?: Date) {
  if (!date) return "Chọn một ngày để xem khung giờ.";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const hhmm = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(
      2,
      "0"
    )}`;

  return `${hhmm(start)} - ${hhmm(end)}`;
}

function toTimeKey(startAt: string, endAt: string) {
  return `${formatTimeRange(startAt, endAt)}`;
}

function isAvailable(slot: DiscoverySlot) {
  return slot.status === "AVAILABLE";
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function LegendChip({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
        colorClass
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      <span>{label}</span>
    </div>
  );
}

export default function TeacherSchedulePage() {
  return (
    <Suspense fallback={<TeacherScheduleLoadingSkeleton />}>
      <TeacherScheduleContent />
    </Suspense>
  );
}

function TeacherScheduleLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-16 bg-slate-800/50 rounded-2xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-8">
            <div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

function TeacherScheduleContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = Number(searchParams.get("teacherId"));
  const validTeacherId = Number.isFinite(teacherId) && teacherId > 0;

  /** Ngày tối thiểu chọn khoảng lặp = hôm nay (đặt ngay, không cần trước 48h). */
  const minBookingDate = useMemo(() => toYmd(new Date()), []);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeZone, setTimeZone] = useState<string | undefined>();

  const [repeatMode, setRepeatMode] = useState<"NONE" | "RECURRING">("NONE");
  const [rangeStart, setRangeStart] = useState(() => toYmd(new Date()));
  const [rangeEnd, setRangeEnd] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return toYmd(next);
  });
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedTimeKeys, setSelectedTimeKeys] = useState<string[]>([]);

  const fromDate = useMemo(() => toYmd(new Date()), []);
  const toDate = useMemo(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    return toYmd(next);
  }, []);

  const { data, isLoading, isError } = useGetTeacherAvailabilityQuery(
    { teacherId, fromDate, toDate },
    { skip: !validTeacherId }
  );

  // Fetch busy slots của học viên theo ngày được chọn
  const selectedDateKey = selectedDate ? toYmd(selectedDate) : "";
  const { data: busySlotsData } = useGetMyBusySlotsQuery(
    { date: selectedDateKey },
    { skip: !selectedDateKey }
  );

  // Kiểm tra 1 slot có trùng giờ với busy slots không
  const isSlotOverlapping = (slot: DiscoverySlot): boolean => {
    if (!busySlotsData?.busySlots?.length) return false;
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    return busySlotsData.busySlots.some((busy) => {
      const busyStart = new Date(busy.startAt).getTime();
      const busyEnd = new Date(busy.endAt).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  };

  // Lấy thông tin busy slot để hiển thị cảnh báo
  const getOverlapWarning = (slot: DiscoverySlot): string | null => {
    if (!busySlotsData?.busySlots?.length) return null;
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    const overlapping = busySlotsData.busySlots.find((busy) => {
      const busyStart = new Date(busy.startAt).getTime();
      const busyEnd = new Date(busy.endAt).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
    if (!overlapping) return null;
    const busyStartTime = new Date(overlapping.startAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const busyEndTime = new Date(overlapping.endAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `Trùng với lịch đã đặt với ${overlapping.teacherName} (${busyStartTime} - ${busyEndTime})`;
  };

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const groups = data?.items ?? [];

  const slotsByDate = useMemo(() => {
    return new Map(groups.map((group) => [group.date, group.slots]));
  }, [groups]);

  useEffect(() => {
    if (selectedDate || groups.length === 0) return;

    const firstDateWithAvailableSlot =
      groups.find((group) => group.slots.some(isAvailable))?.date ?? groups[0].date;

    setSelectedDate(parseLocalDate(firstDateWithAvailableSlot));
  }, [groups, selectedDate]);

  useEffect(() => {
    if (groups.length === 0) {
      if (selectedIds.length > 0) setSelectedIds([]);
      return;
    }

    const availableIds = new Set(
      groups.flatMap((group) =>
        group.slots.filter(isAvailable).map((slot) => slot.timeSlotId)
      )
    );

    const nextIds = selectedIds.filter((id) => availableIds.has(id));
    if (nextIds.length !== selectedIds.length) {
      setSelectedIds(nextIds);
    }
  }, [groups, selectedIds]);

  const selectedDaySlots = useMemo(() => {
    const slots = slotsByDate.get(selectedDateKey) ?? [];
    return [...slots].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [selectedDateKey, slotsByDate]);

  const availableDates = useMemo(
    () =>
      groups
        .filter((group) => group.slots.some(isAvailable))
        .map((group) => parseLocalDate(group.date)),
    [groups]
  );

  const bookedOnlyDates = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            group.slots.length > 0 && group.slots.every((slot) => !isAvailable(slot))
        )
        .map((group) => parseLocalDate(group.date)),
    [groups]
  );

  const availableSlotCount = useMemo(
    () =>
      groups.reduce(
        (total, group) => total + group.slots.filter(isAvailable).length,
        0
      ),
    [groups]
  );

  const manualSelectedSlots = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    return groups
      .flatMap((group) => group.slots)
      .filter((slot) => selectedSet.has(slot.timeSlotId))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [groups, selectedIds]);

  const validRecurringRange =
    !!rangeStart && !!rangeEnd && rangeStart >= minBookingDate && rangeStart <= rangeEnd;

  const recurringPool = useMemo(() => {
    if (!validRecurringRange) return [];

    return groups
      .flatMap((group) => group.slots)
      .filter((slot) => {
        if (!isAvailable(slot)) return false;
        const slotDate = slot.startAt.slice(0, 10);
        if (slotDate < rangeStart || slotDate > rangeEnd) return false;
        return new Date(slot.startAt).getTime() > Date.now();
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [groups, validRecurringRange, rangeStart, rangeEnd]);

  const recurringTimeOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; count: number; sortValue: number }
    >();

    recurringPool.forEach((slot) => {
      const key = toTimeKey(slot.startAt, slot.endAt);
      if (!map.has(key)) {
        const start = new Date(slot.startAt);
        map.set(key, {
          key,
          label: key,
          count: 0,
          sortValue: start.getHours() * 60 + start.getMinutes(),
        });
      }
      map.get(key)!.count += 1;
    });

    return [...map.values()].sort((a, b) => a.sortValue - b.sortValue);
  }, [recurringPool]);

  useEffect(() => {
    const optionKeys = new Set(recurringTimeOptions.map((item) => item.key));
    setSelectedTimeKeys((prev) => prev.filter((item) => optionKeys.has(item)));
  }, [recurringTimeOptions]);

  const recurringMatchedSlots = useMemo(() => {
    if (repeatMode !== "RECURRING") return [];
    if (!validRecurringRange) return [];
    if (selectedWeekdays.length === 0 || selectedTimeKeys.length === 0) return [];

    const weekdaySet = new Set(selectedWeekdays);
    const timeKeySet = new Set(selectedTimeKeys);

    return recurringPool.filter((slot) => {
      const slotDay = new Date(slot.startAt).getDay();
      const slotTimeKey = toTimeKey(slot.startAt, slot.endAt);
      return weekdaySet.has(slotDay) && timeKeySet.has(slotTimeKey);
    });
  }, [
    repeatMode,
    validRecurringRange,
    selectedWeekdays,
    selectedTimeKeys,
    recurringPool,
  ]);

  const recurringExpectedOccurrences = useMemo(() => {
    if (repeatMode !== "RECURRING") return [];
    if (!validRecurringRange) return [];
    if (selectedWeekdays.length === 0 || selectedTimeKeys.length === 0) return [];

    const weekdaySet = new Set(selectedWeekdays);
    const result: Array<{ date: string; timeKey: string }> = [];

    let cursor = parseLocalDate(rangeStart);
    const end = parseLocalDate(rangeEnd);

    while (cursor.getTime() <= end.getTime()) {
      if (weekdaySet.has(cursor.getDay())) {
        selectedTimeKeys.forEach((timeKey) => {
          result.push({
            date: toYmd(cursor),
            timeKey,
          });
        });
      }
      cursor = addDaysLocal(cursor, 1);
    }

    return result;
  }, [
    repeatMode,
    validRecurringRange,
    rangeStart,
    rangeEnd,
    selectedWeekdays,
    selectedTimeKeys,
  ]);

  const recurringMatchedKeys = useMemo(() => {
    return new Set(
      recurringMatchedSlots.map(
        (slot) => `${slot.startAt.slice(0, 10)}__${toTimeKey(slot.startAt, slot.endAt)}`
      )
    );
  }, [recurringMatchedSlots]);

  const skippedOccurrences = useMemo(() => {
    return recurringExpectedOccurrences.filter(
      (item) => !recurringMatchedKeys.has(`${item.date}__${item.timeKey}`)
    );
  }, [recurringExpectedOccurrences, recurringMatchedKeys]);

  const effectiveSelectedSlots =
    repeatMode === "RECURRING" ? recurringMatchedSlots : manualSelectedSlots;

  const effectiveSelectedIds = useMemo(
    () => effectiveSelectedSlots.map((slot) => slot.timeSlotId),
    [effectiveSelectedSlots]
  );

  const toggleSlot = (slot: DiscoverySlot) => {
    if (!isAvailable(slot)) return;

    // Kiểm tra trùng giờ với lịch đã đặt
    if (isSlotOverlapping(slot)) {
      const warning = getOverlapWarning(slot);
      toast.warning("Không thể chọn slot này", {
        description: warning || "Bạn đã có lịch học khác trùng giờ trong ngày.",
      });
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(slot.timeSlotId)
        ? prev.filter((id) => id !== slot.timeSlotId)
        : [...prev, slot.timeSlotId].sort((a, b) => a - b)
    );
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  const toggleTimeKey = (timeKey: string) => {
    setSelectedTimeKeys((prev) =>
      prev.includes(timeKey)
        ? prev.filter((item) => item !== timeKey)
        : [...prev, timeKey]
    );
  };

  const onGoInvoice = () => {
    if (!validTeacherId || effectiveSelectedIds.length === 0) return;

    router.push(
      `/booking/bookappointment?teacherId=${teacherId}&timeSlotIds=${effectiveSelectedIds.join(
        ","
      )}`
    );
  };

  if (!validTeacherId) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-6">
        <Card className="mx-auto max-w-3xl border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-destructive">{t('auto.teacherSchedule_1')}</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute left-[-7rem] top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-0 size-80 rounded-full bg-secondary/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border/60 bg-card/70 backdrop-blur"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>

            <div>
              <p className="text-sm text-muted-foreground">Booking</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('auto.teacherSchedule_2')}</h1>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card className="border-border/60 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <div className="h-[700px] animate-pulse rounded-[28px] bg-muted" />
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <div className="h-[320px] animate-pulse rounded-[28px] bg-muted" />
                </CardContent>
              </Card>
            </div>
          ) : isError ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 text-destructive">{t('auto.teacherSchedule_3')}</CardContent>
            </Card>
          ) : data ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="space-y-6">
                <Card className="overflow-hidden border-border/60 bg-card/80 shadow-xl backdrop-blur">
                  <CardContent className="relative p-6">
                    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-secondary/5 blur-3xl lg:block" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-[28px] border border-border/70 bg-muted/30 p-1.5 shadow-sm">
                          <img
                            src={data.teacherAvatarUrl || "/images/avt-default.jpg"}
                            alt={data.teacherName}
                            className="h-16 w-16 rounded-[22px] object-cover"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="rounded-full px-3 py-1">{t('auto.teacherSchedule_4')}</Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-muted-foreground"
                            >
                              {availableDates.length} ngày có slot trống
                            </Badge>
                          </div>

                          <div>
                            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                              Giáo viên {data.teacherName}
                            </h2>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:min-w-[320px] sm:grid-cols-3">
                        <MiniStat label="Ngày hiển thị" value={`${groups.length}`} />
                        <MiniStat label="Slot trống" value={`${availableSlotCount}`} />
                        <MiniStat label="Đã chọn" value={`${effectiveSelectedIds.length}`} />
                      </div>
                    </div>

                    <div className="relative mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateRange(data.fromDate, data.toDate)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="size-4 text-secondary" />{t('auto.teacherSchedule_5')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-xl">{t('auto.teacherSchedule_6')}</CardTitle>
                    <CardDescription>{t('auto.teacherSchedule_7')}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="mb-2 block text-sm text-muted-foreground">{t('auto.teacherSchedule_8')}</span>
                        <select
                          value={repeatMode}
                          onChange={(e) =>
                            setRepeatMode(e.target.value as "NONE" | "RECURRING")
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                        >
                          <option value="NONE">{t('auto.teacherSchedule_9')}</option>
                          <option value="RECURRING">{t('auto.teacherSchedule_10')}</option>
                        </select>
                      </label>

                      {repeatMode === "RECURRING" ? (
                        <>
                          <label className="block">
                            <span className="mb-2 block text-sm text-muted-foreground">
                              Start date
                            </span>
                            <input
                              type="date"
                              min={minBookingDate}
                              value={rangeStart}
                              onChange={(e) => setRangeStart(e.target.value)}
                              className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm text-muted-foreground">
                              End date
                            </span>
                            <input
                              type="date"
                              min={rangeStart || minBookingDate}
                              value={rangeEnd}
                              onChange={(e) => setRangeEnd(e.target.value)}
                              className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                            />
                          </label>
                        </>
                      ) : (
                        <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">{t('auto.teacherSchedule_11')}</div>
                      )}
                    </div>

                    {repeatMode === "RECURRING" ? (
                      <>
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-foreground">{t('auto.teacherSchedule_12')}</div>

                          <div className="flex flex-wrap gap-2">
                            {WEEKDAY_OPTIONS.map((day) => {
                              const active = selectedWeekdays.includes(day.value);

                              return (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() => toggleWeekday(day.value)}
                                  className={cn(
                                    "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                                    active
                                      ? "border-secondary/30 bg-secondary text-secondary-foreground"
                                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                                  )}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-sm font-medium text-foreground">{t('auto.teacherSchedule_13')}</div>

                          {!validRecurringRange ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">{t('auto.teacherSchedule_14')}</div>
                          ) : recurringTimeOptions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">{t('auto.teacherSchedule_15')}</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {recurringTimeOptions.map((option) => {
                                const active = selectedTimeKeys.includes(option.key);

                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => toggleTimeKey(option.key)}
                                    className={cn(
                                      "rounded-xl border px-4 py-2 text-left transition",
                                      active
                                        ? "border-secondary/30 bg-secondary/10"
                                        : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                                    )}
                                  >
                                    <div className="text-sm font-semibold text-foreground">
                                      {option.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {option.count} slot khả dụng
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <MiniStat
                            label="Buổi khớp"
                            value={`${recurringMatchedSlots.length}`}
                          />
                          <MiniStat
                            label="Buổi bị bỏ qua"
                            value={`${skippedOccurrences.length}`}
                          />
                          <MiniStat
                            label="Phạm vi"
                            value={
                              validRecurringRange
                                ? `${formatDateRange(rangeStart, rangeEnd)}`
                                : "--"
                            }
                          />
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">{t('auto.teacherSchedule_16')}</div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                {repeatMode === "NONE" ? (
                  <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <Card className="flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur lg:h-[540px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <CalendarDays className="size-5 text-primary" />{t('auto.teacherSchedule_17')}</CardTitle>
                      </CardHeader>

                      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
                        <div className="rounded-[28px] border border-border/60 bg-background/70 p-3 shadow-sm">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            locale={vi}
                            timeZone={timeZone}
                            fromDate={parseLocalDate(fromDate)}
                            toDate={parseLocalDate(toDate)}
                            defaultMonth={selectedDate ?? parseLocalDate(fromDate)}
                            modifiers={{
                              hasAvailability: availableDates,
                              bookedOnly: bookedOnlyDates,
                            }}
                            modifiersClassNames={{
                              hasAvailability:
                                "before:absolute before:bottom-2 before:left-1/2 before:size-1.5 before:-translate-x-1/2 before:rounded-full before:bg-primary [&>button]:font-semibold [&>button]:text-primary",
                              bookedOnly:
                                "before:absolute before:bottom-2 before:left-1/2 before:size-1.5 before:-translate-x-1/2 before:rounded-full before:bg-destructive/80 [&>button]:text-muted-foreground",
                            }}
                            className="w-full rounded-3xl [--cell-size:2.8rem] md:[--cell-size:3rem]"
                          />
                        </div>

                        <div className="mt-auto rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">{t('auto.teacherSchedule_18')}<span className="font-semibold text-primary">xanh</span>{t('auto.teacherSchedule_19')}</div>
                      </CardContent>
                    </Card>

                    <Card className="flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur lg:h-[540px]">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <Clock3 className="size-5 text-primary" />{t('auto.teacherSchedule_20')}</CardTitle>
                            <CardDescription className="mt-2">
                              {formatFullDate(selectedDate)}
                            </CardDescription>
                          </div>

                          <Badge
                            variant="outline"
                            className="w-fit rounded-full border-border/70 bg-background/70 px-3 py-1 text-muted-foreground"
                          >
                            {selectedDaySlots.length} ca học trong ngày
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
                        {selectedDaySlots.length === 0 ? (
                          <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
                            <div>
                              <p className="text-lg font-medium text-foreground">{t('auto.teacherSchedule_21')}</p>
                              <p className="mt-2 text-sm text-muted-foreground">{t('auto.teacherSchedule_22')}</p>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="min-h-0 flex-1 pr-4">
                            <div className="space-y-3">
                              {selectedDaySlots.map((slot) => {
                                const selected = selectedIds.includes(slot.timeSlotId);
                                const available = isAvailable(slot);
                                const overlapping = isSlotOverlapping(slot);
                                const warning = getOverlapWarning(slot);

                                return (
                                  <button
                                    key={slot.timeSlotId}
                                    type="button"
                                    disabled={!available}
                                    onClick={() => toggleSlot(slot)}
                                    className={cn(
                                      "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                      selected && "border-secondary/40 bg-secondary/10 shadow-sm",
                                      !selected &&
                                        available &&
                                        !overlapping &&
                                        "border-border/70 bg-background/60 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5",
                                      !available &&
                                        "cursor-not-allowed border-destructive/15 bg-destructive/5 opacity-75",
                                      overlapping &&
                                        !selected &&
                                        "border-amber-500/30 bg-amber-500/5 cursor-not-allowed"
                                    )}
                                  >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={cn(
                                            "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                                            selected &&
                                              "border-secondary/20 bg-secondary text-secondary-foreground",
                                            !selected &&
                                              available &&
                                              !overlapping &&
                                              "border-primary/15 bg-primary/10 text-primary",
                                            !available &&
                                              "border-destructive/15 bg-destructive/10 text-destructive",
                                            overlapping &&
                                              !selected &&
                                              "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                          )}
                                        >
                                          {selected ? (
                                            <CheckCheck className="size-4" />
                                          ) : (
                                            <Clock3 className="size-4" />
                                          )}
                                        </div>

                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-semibold text-foreground">
                                              {formatTimeRange(slot.startAt, slot.endAt)}
                                            </p>

                                            {slot.subject ? (
                                              <Badge
                                                variant="outline"
                                                className="rounded-full border-border/70 bg-muted/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                                              >
                                                {slot.subject}
                                              </Badge>
                                            ) : null}
                                          </div>

                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {slot.durationMinutes} phút
                                          </p>

                                          {overlapping && (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                              {warning}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "w-fit rounded-full px-3 py-1 text-xs font-semibold",
                                          selected &&
                                            "border-transparent bg-secondary text-secondary-foreground",
                                          !selected &&
                                            available &&
                                            !overlapping &&
                                            "border-primary/15 bg-primary/10 text-primary",
                                          !available &&
                                            "border-destructive/15 bg-destructive/10 text-destructive",
                                          overlapping &&
                                            !selected &&
                                            "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                        )}
                                      >
                                        {selected
                                          ? "Đã chọn"
                                          : overlapping
                                          ? "Trùng lịch"
                                          : available
                                          ? "Available"
                                          : "Booked"}
                                      </Badge>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="size-5 text-primary" />{t('auto.teacherSchedule_23')}</CardTitle>
                      <CardDescription>{t('auto.teacherSchedule_24')}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {selectedWeekdays.length === 0 || selectedTimeKeys.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-8 text-sm text-muted-foreground">{t('auto.teacherSchedule_25')}</div>
                      ) : recurringMatchedSlots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-8 text-sm text-muted-foreground">{t('auto.teacherSchedule_26')}</div>
                      ) : (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">{t('auto.teacherSchedule_27')}</div>
                              <div className="mt-1 text-3xl font-black text-foreground">
                                {recurringMatchedSlots.length}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">{t('auto.teacherSchedule_28')}</div>
                              <div className="mt-1 text-3xl font-black text-foreground">
                                {skippedOccurrences.length}
                              </div>
                            </div>
                          </div>

                          <ScrollArea className="h-[360px] pr-3">
                            <div className="space-y-3">
                              {recurringMatchedSlots.map((slot) => (
                                <div
                                  key={slot.timeSlotId}
                                  className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {parseLocalDate(slot.startAt.slice(0, 10)).toLocaleDateString(
                                          "vi-VN",
                                          {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          }
                                        )}
                                      </p>
                                      <p className="mt-1 text-sm text-secondary">
                                        {formatTimeRange(slot.startAt, slot.endAt)}
                                      </p>
                                    </div>

                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-secondary/20 bg-background/80"
                                    >
                                      {slot.subject || "Buổi học"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>

                          {skippedOccurrences.length > 0 ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                              Có {skippedOccurrences.length} buổi trong lịch lặp bị bỏ qua vì
                              không còn slot trống phù hợp trong lúc đó.
                            </div>
                          ) : null}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </section>

              <aside className="h-fit xl:sticky xl:top-6">
                <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-xl backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold">{t('auto.teacherSchedule_29')}</CardTitle>
                    <CardDescription>{t('auto.teacherSchedule_30')}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="text-sm text-muted-foreground">{t('auto.teacherSchedule_31')}</div>
                      <div className="mt-1 text-3xl font-black text-foreground">
                        {effectiveSelectedIds.length}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat
                        label={repeatMode === "RECURRING" ? "Khớp lịch" : "Trong ngày"}
                        value={`${
                          repeatMode === "RECURRING"
                            ? recurringMatchedSlots.length
                            : selectedDaySlots.filter((slot) =>
                                selectedIds.includes(slot.timeSlotId)
                              ).length
                        }`}
                      />
                      <MiniStat
                        label={
                          repeatMode === "RECURRING" ? "Bỏ qua" : "Tổng slot trống"
                        }
                        value={`${
                          repeatMode === "RECURRING"
                            ? skippedOccurrences.length
                            : availableSlotCount
                        }`}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">{t('auto.teacherSchedule_32')}</div>

                      {effectiveSelectedSlots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-6 text-sm text-muted-foreground">{t('auto.teacherSchedule_33')}</div>
                      ) : (
                        <ScrollArea className="h-[280px] pr-3">
                          <div className="space-y-3">
                            {effectiveSelectedSlots.map((slot) => (
                              <div
                                key={slot.timeSlotId}
                                className="rounded-2xl border border-secondary/20 bg-secondary/10 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {parseLocalDate(
                                        new Date(slot.startAt).toISOString().slice(0, 10)
                                      ).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="mt-1 text-sm text-secondary">
                                      {formatTimeRange(slot.startAt, slot.endAt)}
                                    </p>
                                  </div>

                                  {repeatMode === "NONE" ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 rounded-xl text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSlot(slot)}
                                    >{t('auto.teacherSchedule_34')}</Button>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-border/70 bg-background/70"
                                    >{t('auto.teacherSchedule_35')}</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    <Button
                      onClick={onGoInvoice}
                      disabled={effectiveSelectedIds.length === 0}
                      className="w-full rounded-2xl bg-secondary py-6 text-base font-bold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                    >{t('auto.teacherSchedule_36')}</Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
