"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  Clock3,
  Sparkles,
} from "lucide-react";
import { vi } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/UI/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/UI/alert-dialog";
import { cn } from "@/lib/utils";
import { useGetTeacherAvailabilityQuery } from "@/store/services/bookingApi";
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

const BOOKING_LEAD_TIME_HOURS = 48;
const BOOKING_LEAD_TIME_MS = BOOKING_LEAD_TIME_HOURS * 60 * 60 * 1000;

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
  return formatTimeRange(startAt, endAt);
}

function isAvailableStatus(slot: DiscoverySlot) {
  return slot.status === "AVAILABLE";
}

function isLeadTimeBlocked(slot: DiscoverySlot, now = Date.now()) {
  return (
    isAvailableStatus(slot) &&
    new Date(slot.startAt).getTime() < now + BOOKING_LEAD_TIME_MS
  );
}

function isBookable(slot: DiscoverySlot, now = Date.now()) {
  return (
    isAvailableStatus(slot) &&
    new Date(slot.startAt).getTime() >= now + BOOKING_LEAD_TIME_MS
  );
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

export default function TeacherSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = Number(searchParams.get("teacherId"));
  const validTeacherId = Number.isFinite(teacherId) && teacherId > 0;

  const minBookingDate = useMemo(
    () => toYmd(new Date(Date.now() + BOOKING_LEAD_TIME_MS)),
    []
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeZone, setTimeZone] = useState<string | undefined>();
  const [showInvalidSlotAlert, setShowInvalidSlotAlert] = useState(false);

  const [repeatMode, setRepeatMode] = useState<"NONE" | "RECURRING">("NONE");
  const [rangeStart, setRangeStart] = useState(() =>
    toYmd(new Date(Date.now() + BOOKING_LEAD_TIME_MS))
  );
  const [rangeEnd, setRangeEnd] = useState(() => {
    const next = new Date(Date.now() + BOOKING_LEAD_TIME_MS);
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

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const groups = data?.items ?? [];

  const slotsByDate = useMemo(() => {
    return new Map(groups.map((group) => [group.date, group.slots]));
  }, [groups]);

  useEffect(() => {
    if (selectedDate || groups.length === 0) return;

    const firstDateWithBookableSlot =
      groups.find((group) => group.slots.some(isBookable))?.date ?? groups[0].date;

    setSelectedDate(parseLocalDate(firstDateWithBookableSlot));
  }, [groups, selectedDate]);

  useEffect(() => {
    if (groups.length === 0) {
      if (selectedIds.length > 0) setSelectedIds([]);
      return;
    }

    const bookableIds = new Set(
      groups.flatMap((group) =>
        group.slots.filter(isBookable).map((slot) => slot.timeSlotId)
      )
    );

    const nextIds = selectedIds.filter((id) => bookableIds.has(id));
    if (nextIds.length !== selectedIds.length) {
      setSelectedIds(nextIds);
    }
  }, [groups, selectedIds]);

  const selectedDateKey = selectedDate ? toYmd(selectedDate) : "";

  const selectedDaySlots = useMemo(() => {
    const slots = slotsByDate.get(selectedDateKey) ?? [];
    return [...slots].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [selectedDateKey, slotsByDate]);

  const availableDates = useMemo(
    () =>
      groups
        .filter((group) => group.slots.some(isBookable))
        .map((group) => parseLocalDate(group.date)),
    [groups]
  );

  const bookedOnlyDates = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            group.slots.length > 0 &&
            group.slots.every((slot) => !isAvailableStatus(slot))
        )
        .map((group) => parseLocalDate(group.date)),
    [groups]
  );

  const leadTimeBlockedDates = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            group.slots.some(isAvailableStatus) &&
            group.slots.every((slot) => !isBookable(slot))
        )
        .map((group) => parseLocalDate(group.date)),
    [groups]
  );

  const availableSlotCount = useMemo(
    () =>
      groups.reduce(
        (total, group) => total + group.slots.filter(isBookable).length,
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
        if (!isBookable(slot)) return false;
        const slotDate = slot.startAt.slice(0, 10);
        return slotDate >= rangeStart && slotDate <= rangeEnd;
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
    if (isLeadTimeBlocked(slot)) {
      setShowInvalidSlotAlert(true);
      return;
    }

    if (!isAvailableStatus(slot)) return;

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

    const hasInvalidSlot = effectiveSelectedSlots.some((slot) => !isBookable(slot));

    if (hasInvalidSlot) {
      setShowInvalidSlotAlert(true);
      return;
    }

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
          <CardContent className="p-6 text-destructive">
            Thiếu `teacherId` trên URL.
          </CardContent>
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
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Đặt lịch theo giáo viên
              </h1>
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
              <CardContent className="p-6 text-destructive">
                Không tải được lịch rảnh của giáo viên.
              </CardContent>
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
                            <Badge variant="secondary" className="rounded-full px-3 py-1">
                              Đặt lịch học
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-muted-foreground"
                            >
                              {availableDates.length} ngày có slot đặt được
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
                        <MiniStat label="Slot đặt được" value={`${availableSlotCount}`} />
                        <MiniStat label="Đã chọn" value={`${effectiveSelectedIds.length}`} />
                      </div>
                    </div>

                    <div className="relative mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateRange(data.fromDate, data.toDate)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="size-4 text-secondary" />
                        Chỉ có thể đặt các slot trống cách hiện tại ít nhất 48 giờ; vào
                        phòng học trước giờ học 5 phút
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-xl">Thiết lập đặt lịch</CardTitle>
                    <CardDescription>
                      Bạn có thể đặt từng buổi hoặc đặt lặp theo lịch cố định trong
                      một khoảng thời gian.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="mb-2 block text-sm text-muted-foreground">
                          Kiểu đặt lịch
                        </span>
                        <select
                          value={repeatMode}
                          onChange={(e) =>
                            setRepeatMode(e.target.value as "NONE" | "RECURRING")
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring"
                        >
                          <option value="NONE">Không lặp lại</option>
                          <option value="RECURRING">Lặp lại theo lịch cố định</option>
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
                        <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                          Chế độ này chọn thủ công từng slot.
                        </div>
                      )}
                    </div>

                    {repeatMode === "RECURRING" ? (
                      <>
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-foreground">
                            Chọn các thứ trong tuần
                          </div>

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
                          <div className="text-sm font-medium text-foreground">
                            Chọn khung giờ lặp
                          </div>

                          {!validRecurringRange ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                              Hãy chọn khoảng ngày hợp lệ trước.
                            </div>
                          ) : recurringTimeOptions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                              Không có slot khả dụng trong khoảng ngày này.
                            </div>
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

                        <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                          Hệ thống chỉ gom các slot còn trống và cách hiện tại ít nhất
                          48 giờ. Nếu buổi nào không còn slot phù hợp thì sẽ tự bỏ qua.
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                {repeatMode === "NONE" ? (
                  <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <Card className="flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur lg:h-[540px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <CalendarDays className="size-5 text-primary" />
                          Chọn ngày học
                        </CardTitle>
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
                              leadTimeBlocked: leadTimeBlockedDates,
                            }}
                            modifiersClassNames={{
                              hasAvailability:
                                "before:absolute before:bottom-2 before:left-1/2 before:size-1.5 before:-translate-x-1/2 before:rounded-full before:bg-primary [&>button]:font-semibold [&>button]:text-primary",
                              bookedOnly:
                                "before:absolute before:bottom-2 before:left-1/2 before:size-1.5 before:-translate-x-1/2 before:rounded-full before:bg-destructive/80 [&>button]:text-muted-foreground",
                              leadTimeBlocked:
                                "before:absolute before:bottom-2 before:left-1/2 before:size-1.5 before:-translate-x-1/2 before:rounded-full before:bg-amber-500 [&>button]:text-amber-700 dark:[&>button]:text-amber-300",
                            }}
                            className="w-full rounded-3xl [--cell-size:2.8rem] md:[--cell-size:3rem]"
                          />
                        </div>

                        <div className="mt-auto rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                          Chấm <span className="font-semibold text-primary">xanh</span> là
                          ngày còn slot đặt được. Chấm{" "}
                          <span className="font-semibold text-amber-600 dark:text-amber-300">
                            vàng
                          </span>{" "}
                          là còn slot trống nhưng dưới 48 giờ nên chưa thể đặt.
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur lg:h-[540px]">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <Clock3 className="size-5 text-primary" />
                              Khung giờ học
                            </CardTitle>
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
                              <p className="text-lg font-medium text-foreground">
                                Ngày này chưa có lịch học
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Hãy chọn ngày khác trên lịch hoặc đợi giáo viên mở
                                thêm slot mới.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="min-h-0 flex-1 pr-4">
                            <div className="space-y-3">
                              {selectedDaySlots.map((slot) => {
                                const selected = selectedIds.includes(slot.timeSlotId);
                                const availableStatus = isAvailableStatus(slot);
                                const bookable = isBookable(slot);
                                const leadTimeBlocked = isLeadTimeBlocked(slot);
                                const unavailable = !availableStatus;

                                return (
                                  <button
                                    key={slot.timeSlotId}
                                    type="button"
                                    disabled={unavailable}
                                    onClick={() => toggleSlot(slot)}
                                    className={cn(
                                      "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                      selected && "border-secondary/40 bg-secondary/10 shadow-sm",
                                      !selected &&
                                        bookable &&
                                        "border-border/70 bg-background/60 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5",
                                      !selected &&
                                        leadTimeBlocked &&
                                        "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/35 hover:bg-amber-500/10",
                                      unavailable &&
                                        "cursor-not-allowed border-destructive/15 bg-destructive/5 opacity-75"
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
                                              bookable &&
                                              "border-primary/15 bg-primary/10 text-primary",
                                            !selected &&
                                              leadTimeBlocked &&
                                              "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                            unavailable &&
                                              "border-destructive/15 bg-destructive/10 text-destructive"
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
                                        </div>
                                      </div>

                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "w-fit rounded-full px-3 py-1 text-xs font-semibold",
                                          selected &&
                                            "border-transparent bg-secondary text-secondary-foreground",
                                          !selected &&
                                            bookable &&
                                            "border-primary/15 bg-primary/10 text-primary",
                                          !selected &&
                                            leadTimeBlocked &&
                                            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                          unavailable &&
                                            "border-destructive/15 bg-destructive/10 text-destructive"
                                        )}
                                      >
                                        {selected
                                          ? "Đã chọn"
                                          : bookable
                                          ? "Có thể đặt"
                                          : leadTimeBlocked
                                          ? "Không đặt được (< 48h)"
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
                        <Sparkles className="size-5 text-primary" />
                        Preview lịch lặp sẽ được book
                      </CardTitle>
                      <CardDescription>
                        Hệ thống tự gom các slot còn trống đúng theo khoảng ngày, thứ
                        trong tuần và khung giờ bạn đã chọn.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {selectedWeekdays.length === 0 || selectedTimeKeys.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-8 text-sm text-muted-foreground">
                          Hãy chọn các thứ trong tuần và ít nhất một khung giờ để xem
                          preview.
                        </div>
                      ) : recurringMatchedSlots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-8 text-sm text-muted-foreground">
                          Không tìm thấy slot khả dụng khớp với lịch lặp bạn đã chọn.
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">
                                Buổi sẽ book
                              </div>
                              <div className="mt-1 text-3xl font-black text-foreground">
                                {recurringMatchedSlots.length}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">
                                Buổi bị bỏ qua
                              </div>
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
                    <CardTitle className="text-xl font-semibold">
                      Chuẩn bị thanh toán
                    </CardTitle>
                    <CardDescription>
                      Khi bấm tiếp tục, hệ thống sẽ gửi đúng danh sách slot đang được
                      chọn sang trang quote/checkout.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="text-sm text-muted-foreground">Số buổi đã chọn</div>
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
                          repeatMode === "RECURRING" ? "Bỏ qua" : "Tổng slot đặt được"
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
                      <div className="text-sm font-medium text-foreground">
                        Các buổi sẽ gửi sang quote
                      </div>

                      {effectiveSelectedSlots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-6 text-sm text-muted-foreground">
                          Chưa có buổi nào được chọn.
                        </div>
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
                                      {parseLocalDate(slot.startAt.slice(0, 10)).toLocaleDateString(
                                        "vi-VN",
                                        {
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

                                  {repeatMode === "NONE" ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 rounded-xl text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSlot(slot)}
                                    >
                                      Bỏ chọn
                                    </Button>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-border/70 bg-background/70"
                                    >
                                      Tự động
                                    </Badge>
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
                    >
                      Xem hóa đơn các buổi đã chọn
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}
        </div>
      </div>

      <AlertDialog open={showInvalidSlotAlert} onOpenChange={setShowInvalidSlotAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Không thể đặt lịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn không thể đặt những lịch học cách hiện tại dưới 48 tiếng. Vui lòng
              chọn slot khác để tiếp tục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInvalidSlotAlert(false)}>
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
