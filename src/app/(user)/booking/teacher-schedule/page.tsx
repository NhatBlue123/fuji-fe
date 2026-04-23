"use client";

export const dynamic = "force-dynamic";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useGetTeacherAvailabilityQuery, useGetMyBusySlotsQuery, useGetMyBusySlotsInRangeQuery } from "@/store/services/bookingApi";
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

function TeacherSchedulePageContent() {
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

  // Fetch busy slots của học viên theo ngày được chọn (cho mode đơn lẻ)
  const selectedDateKey = selectedDate ? toYmd(selectedDate) : "";
  const { data: busySlotsData } = useGetMyBusySlotsQuery(
    { date: selectedDateKey },
    { skip: !selectedDateKey || repeatMode === "RECURRING" }
  );

  // Fetch busy slots của học viên cho toàn bộ range (cho mode recurring)
  const validRecurringRange =
    !!rangeStart && !!rangeEnd && rangeStart >= minBookingDate && rangeStart <= rangeEnd;
  const { data: busySlotsRangeData } = useGetMyBusySlotsInRangeQuery(
    { fromDate: rangeStart, toDate: rangeEnd },
    { skip: repeatMode !== "RECURRING" || !validRecurringRange }
  );

  // Kiểm tra 1 slot có trùng giờ với busy slots (single-day, dùng cho mode đơn lẻ)
  const isSlotOverlappingSingleDay = (slot: DiscoverySlot): boolean => {
    if (!busySlotsData?.busySlots?.length) return false;
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    return busySlotsData.busySlots.some((busy) => {
      const busyStart = new Date(busy.startAt).getTime();
      const busyEnd = new Date(busy.endAt).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  };

  // Kiểm tra 1 slot có trùng giờ với busy slots (range, dùng cho mode recurring)
  const isSlotOverlappingRange = (slot: DiscoverySlot): boolean => {
    if (!busySlotsRangeData?.length) return false;
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    return busySlotsRangeData.some((busy) => {
      const busyStart = new Date(busy.startAt).getTime();
      const busyEnd = new Date(busy.endAt).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  };

  // Lấy cảnh báo trùng lịch cho 1 slot
  const getOverlapWarning = (slot: DiscoverySlot): string | null => {
    const busyList = repeatMode === "RECURRING" ? busySlotsRangeData : busySlotsData?.busySlots;
    if (!busyList?.length) return null;
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    const overlapping = busyList.find((busy) => {
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

  const recurringPoolAll = useMemo(() => {
    if (!validRecurringRange) return [];

    return groups
      .flatMap((group) => group.slots)
      .filter((slot) => {
        if (!isAvailable(slot)) return false;
        const slotDate = slot.startAt.slice(0, 10);
        if (slotDate < rangeStart || slotDate > rangeEnd) return false;
        if (new Date(slot.startAt).getTime() <= Date.now()) return false;
        return true;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [groups, validRecurringRange, rangeStart, rangeEnd]);

  const recurringPool = useMemo(() => {
    if (!validRecurringRange || !busySlotsRangeData?.length) return recurringPoolAll;
    return recurringPoolAll.filter((slot) => {
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      return !busySlotsRangeData.some((busy) => {
        const busyStart = new Date(busy.startAt).getTime();
        const busyEnd = new Date(busy.endAt).getTime();
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });
  }, [validRecurringRange, recurringPoolAll, busySlotsRangeData]);

  const recurringTimeOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; count: number; overlapCount: number; sortValue: number }
    >();

    recurringPoolAll.forEach((slot) => {
      const key = toTimeKey(slot.startAt, slot.endAt);
      if (!map.has(key)) {
        const start = new Date(slot.startAt);
        map.set(key, {
          key,
          label: key,
          count: 0,
          overlapCount: 0,
          sortValue: start.getHours() * 60 + start.getMinutes(),
        });
      }
      if (busySlotsRangeData?.some((busy) => {
        const slotStart = new Date(slot.startAt).getTime();
        const slotEnd = new Date(slot.endAt).getTime();
        const busyStart = new Date(busy.startAt).getTime();
        const busyEnd = new Date(busy.endAt).getTime();
        return slotStart < busyEnd && slotEnd > busyStart;
      })) {
        map.get(key)!.overlapCount += 1;
      } else {
        map.get(key)!.count += 1;
      }
    });

    return [...map.values()].sort((a, b) => a.sortValue - b.sortValue);
  }, [recurringPoolAll, busySlotsRangeData]);

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

  // Tính số slot trùng lịch đã bị loại khỏi pool (teacher có slot nhưng trùng với lịch học viên)
  const slotsExcludedByOverlap = useMemo(() => {
    if (!validRecurringRange) return 0;
    return recurringPoolAll.length - recurringPool.length;
  }, [validRecurringRange, recurringPoolAll, recurringPool]);

  // Số buổi trùng lịch cá nhân (trong phạm vi + thứ + giờ user chọn, nhưng bị trùng với lịch đã đặt)
  // = Số expected occurrences trùng thứ+giờ nhưng KHÔNG nằm trong recurringMatchedSlots
  const conflictSkipCount = useMemo(() => {
    if (repeatMode !== "RECURRING") return 0;
    if (!validRecurringRange) return 0;
    if (selectedWeekdays.length === 0 || selectedTimeKeys.length === 0) return 0;

    const weekdaySet = new Set(selectedWeekdays);
    const timeKeySet = new Set(selectedTimeKeys);

    return recurringExpectedOccurrences.filter(
      (item) => {
        if (!weekdaySet.has(new Date(item.date + "T12:00:00").getDay())) return false;
        if (!timeKeySet.has(item.timeKey)) return false;
        return true;
      }
    ).length - recurringMatchedSlots.length;
  }, [
    repeatMode,
    validRecurringRange,
    selectedWeekdays,
    selectedTimeKeys,
    recurringMatchedSlots,
    recurringExpectedOccurrences,
  ]);

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

  // Các slot trùng lịch bị bỏ qua (hiển thị trong danh sách chọn)
  const skippedOverlappingSlots = useMemo(() => {
    if (repeatMode !== "RECURRING") return [];
    if (!validRecurringRange) return [];
    if (selectedWeekdays.length === 0 || selectedTimeKeys.length === 0) return [];

    const weekdaySet = new Set(selectedWeekdays);
    const timeKeySet = new Set(selectedTimeKeys);
    const matchedKeys = new Set(
      recurringMatchedSlots.map(
        (slot) =>
          `${slot.startAt.slice(0, 10)}__${toTimeKey(slot.startAt, slot.endAt)}`
      )
    );

    return recurringPoolAll.filter((slot) => {
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      const isOverlapping = busySlotsRangeData?.some((busy) => {
        const busyStart = new Date(busy.startAt).getTime();
        const busyEnd = new Date(busy.endAt).getTime();
        return slotStart < busyEnd && slotEnd > busyStart;
      });
      if (!isOverlapping) return false;
      const slotDay = new Date(slot.startAt).getDay();
      const slotTimeKey = toTimeKey(slot.startAt, slot.endAt);
      if (!weekdaySet.has(slotDay) || !timeKeySet.has(slotTimeKey)) return false;
      return true;
    });
  }, [repeatMode, validRecurringRange, selectedWeekdays, selectedTimeKeys, recurringPoolAll, recurringMatchedSlots, busySlotsRangeData]);

  const toggleSlot = (slot: DiscoverySlot) => {
    if (!isAvailable(slot)) return;

    // Kiểm tra trùng giờ với lịch đã đặt
    const isOverlapping = repeatMode === "RECURRING"
      ? isSlotOverlappingRange(slot)
      : isSlotOverlappingSingleDay(slot);

    if (isOverlapping) {
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
                                      {option.count} buổi khả dụng
                                      {option.overlapCount > 0 && (
                                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                                          (có {option.overlapCount} trùng)
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <MiniStat
                            label="Buổi khớp"
                            value={`${recurringMatchedSlots.length}`}
                          />
                          <MiniStat
                            label="Bị bỏ qua"
                            value={`${skippedOccurrences.length}`}
                          />
                          <MiniStat
                            label="Bị trùng lịch"
                            value={`${conflictSkipCount > 0 ? conflictSkipCount : 0}`}
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
                          {t('auto.teacherSchedule_16')}
                          {conflictSkipCount > 0 && (
                            <div className="mt-2 flex flex-col gap-1.5">
                              <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
                                Hệ thống sẽ tự động bỏ qua <strong>{conflictSkipCount}</strong> buổi bị trùng với lịch học hiện tại của bạn. Bạn chỉ thanh toán cho các buổi còn lại.
                              </span>
                              {slotsExcludedByOverlap > 0 && (
                                <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-orange-700 dark:text-orange-300">
                                  Có {slotsExcludedByOverlap} slot giáo viên bị ẩn do trùng với lịch học đã đặt của bạn.
                                </span>
                              )}
                            </div>
                          )}
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
                                const overlapping = isSlotOverlappingSingleDay(slot);
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
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">Tổng buổi hợp lệ</div>
                              <div className="mt-1 text-3xl font-black text-green-600 dark:text-green-400">
                                {recurringMatchedSlots.length}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">sẽ được thanh toán</div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                              <div className="text-sm text-muted-foreground">Bị bỏ qua</div>
                              <div className="mt-1 text-3xl font-black text-slate-500">
                                {skippedOccurrences.length}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">không có slot giáo viên</div>
                            </div>

                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                              <div className="text-sm text-amber-700 dark:text-amber-300">Bị trùng lịch</div>
                              <div className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">
                                {conflictSkipCount > 0 ? conflictSkipCount : 0}
                              </div>
                              <div className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70">tự động bỏ qua</div>
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

                          {skippedOccurrences.length > 0 || conflictSkipCount > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {conflictSkipCount > 0 && (
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                                  <strong>{conflictSkipCount}</strong> buổi bị trùng với lịch học hiện tại của bạn và đã được tự động bỏ qua.
                                </div>
                              )}
                              {skippedOccurrences.length > 0 && (
                                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-300">
                                  <strong>{skippedOccurrences.length}</strong> buổi bị bỏ qua vì không có slot giáo viên phù hợp trong khoảng thời gian đó.
                                </div>
                              )}
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
                        label={repeatMode === "RECURRING" ? "Buổi hợp lệ" : "Trong ngày"}
                        value={`${
                          effectiveSelectedSlots.length
                        }`}
                      />
                      <MiniStat
                        label={repeatMode === "RECURRING" ? "Bị bỏ qua" : "Tổng slot trống"}
                        value={`${
                          repeatMode === "RECURRING"
                            ? skippedOccurrences.length + (conflictSkipCount > 0 ? conflictSkipCount : 0)
                            : availableSlotCount
                        }`}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">{t('auto.teacherSchedule_32')}</div>

                      {effectiveSelectedSlots.length === 0 && skippedOverlappingSlots.length === 0 ? (
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

                            {skippedOverlappingSlots.length > 0 && (
                              <>
                                <div className="flex items-center gap-2 pt-1">
                                  <Separator className="flex-1" />
                                  <span className="text-xs text-muted-foreground">
                                    Bị bỏ qua do trùng lịch
                                  </span>
                                  <Separator className="flex-1" />
                                </div>
                                {skippedOverlappingSlots.map((slot) => {
                                  const overlapInfo = (() => {
                                    if (!busySlotsRangeData?.length) return null;
                                    const slotStart = new Date(slot.startAt).getTime();
                                    const slotEnd = new Date(slot.endAt).getTime();
                                    return busySlotsRangeData.find((busy) => {
                                      const busyStart = new Date(busy.startAt).getTime();
                                      const busyEnd = new Date(busy.endAt).getTime();
                                      return slotStart < busyEnd && slotEnd > busyStart;
                                    });
                                  })();
                                  return (
                                    <div
                                      key={`skip-${slot.timeSlotId}`}
                                      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 opacity-70"
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
                                          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                            {formatTimeRange(slot.startAt, slot.endAt)}
                                          </p>
                                          {overlapInfo && (
                                            <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
                                              Trùng với lịch {overlapInfo.teacherName}
                                            </p>
                                          )}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="rounded-full border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        >
                                          Bỏ qua
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block">
                            <Button
                              onClick={onGoInvoice}
                              disabled={effectiveSelectedIds.length === 0}
                              className="w-full rounded-2xl bg-secondary py-6 text-base font-bold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >{t('auto.teacherSchedule_36')}</Button>
                          </span>
                        </TooltipTrigger>
                        {effectiveSelectedIds.length === 0 && repeatMode === "RECURRING" && (
                          <TooltipContent side="top" className="max-w-xs text-center">
                            <p>Không có buổi nào khả dụng để đặt.</p>
                            {conflictSkipCount > 0 && <p className="mt-1">{conflictSkipCount} buổi bị trùng lịch cá nhân.</p>}
                            {skippedOccurrences.length > 0 && <p className="mt-1">{skippedOccurrences.length} buổi không có slot giáo viên.</p>}
                          </TooltipContent>
                        )}
                        {effectiveSelectedIds.length === 0 && repeatMode === "NONE" && (
                          <TooltipContent side="top">
                            <p>Vui lòng chọn ít nhất một buổi học.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
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

export default function TeacherSchedulePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-6">
          <Card className="mx-auto max-w-3xl border-border/60 bg-card/70">
            <CardContent className="p-6 text-muted-foreground">
              Đang tải lịch giáo viên...
            </CardContent>
          </Card>
        </main>
      }
    >
      <TeacherSchedulePageContent />
    </Suspense>
  );
}
