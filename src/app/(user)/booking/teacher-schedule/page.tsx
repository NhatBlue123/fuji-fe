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
import { useGetTeacherAvailabilityQuery } from "@/store/services/bookingApi";
import type { DiscoverySlot } from "@/types/booking";

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

function formatDateRange(fromDate: string, toDate: string) {
  return `${parseLocalDate(fromDate).toLocaleDateString("vi-VN")} - ${parseLocalDate(toDate).toLocaleDateString("vi-VN")}`;
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
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return `${hhmm(start)} - ${hhmm(end)}`;
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = Number(searchParams.get("teacherId"));
  const validTeacherId = Number.isFinite(teacherId) && teacherId > 0;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeZone, setTimeZone] = useState<string | undefined>();

  const fromDate = useMemo(() => toYmd(new Date()), []);
  const BOOKING_PANEL_HEIGHT = "lg:h-[540px]";
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

    const firstDateWithAvailableSlot =
      groups.find((group) => group.slots.some(isAvailable))?.date ?? groups[0].date;

    setSelectedDate(parseLocalDate(firstDateWithAvailableSlot));
  }, [groups, selectedDate]);

  useEffect(() => {
  if (groups.length === 0) {
    if (selectedIds.length > 0) setSelectedIds([]); // Chỉ set nếu mảng cũ không rỗng
    return;
  }

  const availableIds = new Set(
    groups.flatMap((group) =>
      group.slots.filter(isAvailable).map((slot) => slot.timeSlotId)
    )
  );

  const nextIds = selectedIds.filter((id) => availableIds.has(id));

  // Kiểm tra: Nếu số lượng phần tử khác nhau hoặc nội dung khác nhau thì mới set
  if (nextIds.length !== selectedIds.length) {
    setSelectedIds(nextIds);
  }
}, [groups]); 

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

  const selectedSlots = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    return groups
      .flatMap((group) => group.slots)
      .filter((slot) => selectedSet.has(slot.timeSlotId))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [groups, selectedIds]);

  const toggleSlot = (slot: DiscoverySlot) => {
    if (!isAvailable(slot)) return;

    setSelectedIds((prev) =>
      prev.includes(slot.timeSlotId)
        ? prev.filter((id) => id !== slot.timeSlotId)
        : [...prev, slot.timeSlotId].sort((a, b) => a - b)
    );
  };

  const onGoInvoice = () => {
    if (!validTeacherId || selectedIds.length === 0) return;

    router.push(
      `/booking/bookappointment?teacherId=${teacherId}&timeSlotIds=${selectedIds.join(",")}`
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
                Toàn bộ lịch rảnh của giáo viên
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
                        <MiniStat label="Đã chọn" value={`${selectedIds.length}`} />
                      </div>
                    </div>

                    <div className="relative mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateRange(data.fromDate, data.toDate)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="size-4 text-secondary" />
                        {selectedIds.length > 0
                          ? `${selectedIds.length} khung giờ đang được chọn`
                          : "Chưa chọn khung giờ nào"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                

                <Separator />

                <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
  <Card
    className={cn(
      "flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur",
      BOOKING_PANEL_HEIGHT
    )}
  >
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

      <div className="mt-auto rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
        Chấm <span className="font-semibold text-primary">xanh</span> là ngày
        còn khung giờ trống.
      </div>
    </CardContent>
  </Card>

  <Card
    className={cn(
      "flex flex-col border-border/60 bg-card/80 shadow-xl backdrop-blur",
      BOOKING_PANEL_HEIGHT
    )}
  >
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
              Hãy chọn ngày khác trên lịch hoặc đợi giáo viên mở thêm slot mới.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1 pr-4">
          <div className="space-y-3">
            {selectedDaySlots.map((slot) => {
              const selected = selectedIds.includes(slot.timeSlotId);
              const available = isAvailable(slot);

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
                      "border-border/70 bg-background/60 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5",
                    !available &&
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
                            available &&
                            "border-primary/15 bg-primary/10 text-primary",
                          !available &&
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
                          available &&
                          "border-primary/15 bg-primary/10 text-primary",
                        !available &&
                          "border-destructive/15 bg-destructive/10 text-destructive"
                      )}
                    >
                      {selected ? "Đã chọn" : available ? "Available" : "Booked"}
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

              </section>

              <aside className="h-fit xl:sticky xl:top-6">
                <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-xl backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold">
                      Chuẩn bị thanh toán
                    </CardTitle>
                    <CardDescription>
                      Giữ nguyên luồng chọn slot rồi chuyển sang phần thanh toán.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="text-sm text-muted-foreground">
                        Số buổi đã chọn
                      </div>
                      <div className="mt-1 text-3xl font-black text-foreground">
                        {selectedIds.length}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat
                        label="Trong ngày"
                        value={`${selectedDaySlots.filter((slot) =>
                          selectedIds.includes(slot.timeSlotId)
                        ).length}`}
                      />
                      <MiniStat
                        label="Tổng slot trống"
                        value={`${availableSlotCount}`}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">
                        Các buổi đã chọn
                      </div>

                      {selectedSlots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-6 text-sm text-muted-foreground">
                          Chưa có buổi nào được chọn.
                        </div>
                      ) : (
                        <ScrollArea className="h-[280px] pr-3">
                          <div className="space-y-3">
                            {selectedSlots.map((slot) => (
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

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-xl text-muted-foreground hover:text-foreground"
                                    onClick={() => toggleSlot(slot)}
                                  >
                                    Bỏ chọn
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    <Button
                      onClick={onGoInvoice}
                      disabled={selectedIds.length === 0}
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
    </main>
  );
}
