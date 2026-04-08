"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addWeeks, format, isToday, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  User2,
} from "lucide-react";

import { Calendar } from "@/components/UI/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useDeleteTimeSlotMutation,
  useGetMyTeacherScheduleQuery,
  useUpdateTimeSlotMutation,
} from "@/store/services/bookingApi";
import type { TeacherScheduleSlot } from "@/types/booking";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HOUR_HEIGHT = 72;
const TIME_COLUMN_WIDTH = 84;

function toYmd(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatHm(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${formatHm(startAt)} - ${formatHm(endAt)}`;
}

function getMinutesOfDay(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{helper}</p>
    </div>
  );
}

function StatusChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "booked" | "free";
}) {
  const className =
    tone === "booked"
      ? "border-primary/30 bg-primary/10 text-primary"
      : tone === "free"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "border-secondary/30 bg-secondary/20 text-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
        className,
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ScheduleEvent({
  slot,
  startHour,
  onEdit,
  onDelete,
}: {
  slot: TeacherScheduleSlot;
  startHour: number;
  onEdit?: (slot: TeacherScheduleSlot) => void;
  onDelete?: (slot: TeacherScheduleSlot) => void;
}) {
  const startMinutes = getMinutesOfDay(slot.startAt) - startHour * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max((slot.durationMinutes / 60) * HOUR_HEIGHT - 6, 58);
  const isBooked = slot.status === "BOOKED";
  const isCompleted = slot.status === "COMPLETED";
  const isNoShow = slot.status === "NO_SHOW";
  const isCancelled = slot.status === "CANCELLED";
  const isLockedSlot = isBooked || isCompleted || isNoShow || isCancelled;
  const canEdit =
    !isLockedSlot && onEdit && new Date(slot.startAt) > new Date();
  const canDelete = !isLockedSlot && onDelete;

  return (
    <div
      title={
        isBooked
          ? `Học viên: ${slot.studentName ?? "Không rõ"}`
          : "Chưa có học viên đặt lịch"
      }
      className={cn(
        "absolute left-2 right-2 rounded-xl border px-3 py-2 shadow-sm",
        isBooked
          ? "border-primary/30 bg-primary/10"
          : isCompleted
            ? "border-slate-400/30 bg-slate-400/10"
            : isNoShow
              ? "border-amber-500/30 bg-amber-500/10"
              : isCancelled
                ? "border-red-500/30 bg-red-500/10"
                : "border-emerald-500/30 bg-emerald-500/10",
      )}
      style={{ top, height }}
    >
      <div className="relative flex h-full flex-col justify-between gap-2 overflow-hidden">
        {!isBooked && (canEdit || canDelete) && (
          <div
            className="absolute right-0 top-0 z-10 flex gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <button
                type="button"
                className="rounded-md border border-border/60 bg-background/80 p-1 text-foreground shadow-sm hover:bg-accent"
                title="Sửa giá / môn học"
                onClick={() => onEdit?.(slot)}
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="rounded-md border border-border/60 bg-background/80 p-1 text-destructive shadow-sm hover:bg-destructive/10"
                title="Xóa slot trống"
                onClick={() => onDelete?.(slot)}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 pr-14">
          <p className="text-xs font-bold text-foreground">
            {formatTimeRange(slot.startAt, slot.endAt)}
          </p>

          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
              isBooked
                ? "border-primary/30 bg-primary/15 text-primary"
                : isCompleted
                  ? "border-slate-400/30 bg-slate-400/15 text-slate-600 dark:text-slate-300"
                  : isNoShow
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : isCancelled
                      ? "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-300"
                      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
            )}
          >
            {isBooked
              ? "Booked"
              : isCompleted
                ? "Completed"
                : isNoShow
                  ? "No-show"
                  : isCancelled
                    ? "Cancelled"
                    : "Trống"}
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
          <p className="truncate text-sm font-bold text-foreground">
            {slot.subject}
          </p>

          {isLockedSlot ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <User2
                  className={cn(
                    "size-3.5",
                    isBooked ? "text-primary" : "text-slate-500",
                  )}
                />
                <span className="truncate">
                  {isBooked
                    ? "Đã booked"
                    : isCompleted
                      ? "Đã hoàn thành"
                      : isNoShow
                        ? "Vắng mặt"
                        : "Đã hủy"}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Học viên: {slot.studentName ?? "Không rõ tên"}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5 text-emerald-500" />
              <span>Chưa booked</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeachingSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<TeacherScheduleSlot | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<TeacherScheduleSlot | null>(
    null,
  );
  const [editPrice, setEditPrice] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [deleteTimeSlot, { isLoading: deletingSlot }] =
    useDeleteTimeSlotMutation();
  const [updateTimeSlot, { isLoading: updatingSlot }] =
    useUpdateTimeSlotMutation();

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const fromDate = useMemo(() => toYmd(weekDays[0]), [weekDays]);
  const toDate = useMemo(
    () => toYmd(weekDays[weekDays.length - 1]),
    [weekDays],
  );

  const { data, isLoading, isFetching, isError } = useGetMyTeacherScheduleQuery(
    { fromDate, toDate },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  const groups = data?.items ?? [];

  const slotsByDate = useMemo(() => {
    return new Map(groups.map((group) => [group.date, group.slots]));
  }, [groups]);

  const allSlots = useMemo(
    () => groups.flatMap((group) => group.slots),
    [groups],
  );

  const bookedCount = useMemo(
    () => allSlots.filter((slot) => slot.status === "BOOKED").length,
    [allSlots],
  );

  const availableCount = allSlots.length - bookedCount;

  const hourRange = useMemo(() => {
    if (allSlots.length === 0) {
      return { start: 6, end: 22 };
    }

    let minHour = 23;
    let maxHour = 0;

    allSlots.forEach((slot) => {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);
      const slotStartHour = start.getHours();
      const slotEndHour =
        end.getHours() + (end.getMinutes() > 0 || end.getSeconds() > 0 ? 1 : 0);

      minHour = Math.min(minHour, slotStartHour);
      maxHour = Math.max(maxHour, slotEndHour);
    });

    return {
      start: Math.max(0, minHour - 1),
      end: Math.min(24, maxHour + 1),
    };
  }, [allSlots]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: Math.max(hourRange.end - hourRange.start, 1) },
        (_, index) => hourRange.start + index,
      ),
    [hourRange],
  );

  const totalGridHeight = hours.length * HOUR_HEIGHT;

  useEffect(() => {
    if (!scrollRef.current || allSlots.length === 0) return;

    const firstSlot = allSlots[0];
    const startMinutes =
      getMinutesOfDay(firstSlot.startAt) - hourRange.start * 60;
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    scrollRef.current.scrollTop = Math.max(top - HOUR_HEIGHT, 0);
  }, [allSlots, hourRange.start]);

  useEffect(() => {
    if (editTarget) {
      setEditPrice(String(editTarget.tuitionBlossom ?? editTarget.tuitionVnd));
      setEditSubject(editTarget.subject);
      setEditStartTime(formatHm(editTarget.startAt));
      setEditEndTime(formatHm(editTarget.endAt));
    }
  }, [editTarget]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTimeSlot(deleteTarget.timeSlotId).unwrap();
      setDeleteTarget(null);
    } catch {
      alert("Không xóa được slot. Kiểm tra slot còn trống và thử lại.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const price = Number(editPrice);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Nhập giá hợp lệ (hoa).");
      return;
    }
    const subject = editSubject.trim();
    if (!subject) {
      alert("Nhập chủ đề / môn học.");
      return;
    }

    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(editStartTime) || !timeRe.test(editEndTime)) {
      alert("Giờ không hợp lệ (HH:mm).");
      return;
    }

    const slotDate = new Date(editTarget.startAt);
    const datePrefix = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, "0")}-${String(slotDate.getDate()).padStart(2, "0")}`;

    const origStart = formatHm(editTarget.startAt);
    const origEnd = formatHm(editTarget.endAt);
    const timeChanged = editStartTime !== origStart || editEndTime !== origEnd;

    const payload: Parameters<typeof updateTimeSlot>[0] = {
      id: editTarget.timeSlotId,
      price,
      subject,
    };

    if (timeChanged) {
      payload.startAt = `${datePrefix}T${editStartTime}:00`;
      payload.endAt = `${datePrefix}T${editEndTime}:00`;
    }

    try {
      await updateTimeSlot(payload).unwrap();
      setEditTarget(null);
    } catch {
      alert(
        "Không cập nhật được. Slot phải còn trống, chưa qua giờ và không trùng lịch khác.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Lịch dạy giáo viên
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Theo dõi toàn bộ slot đã đăng ký trong tuần và kiểm tra ca nào đã
              có học viên đặt. Slot trống: dùng nút bút / thùng trên khối lịch
              để sửa giá hoặc xóa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-xl font-bold">
              <Link href="/admin/teacher-schedules/create-slot">
                <Plus className="size-4" />
                Nhập lịch rảnh
              </Link>
            </Button>

            <Button
              className="rounded-xl font-bold"
              onClick={() => setSelectedDate(new Date())}
            >
              Hôm nay
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setSelectedDate((prev) => addWeeks(prev, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setSelectedDate((prev) => addWeeks(prev, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl font-bold capitalize"
                >
                  <CalendarDays className="mr-2 size-4" />
                  {format(weekStart, "MMMM yyyy", { locale: vi })}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto rounded-2xl p-2" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusChip label="Lịch tuần 7 ngày" />
          <StatusChip label="Đã booked" tone="booked" />
          <StatusChip label="Chưa booked" tone="free" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng slot tuần"
          value={`${allSlots.length}`}
          helper={`${format(weekDays[0], "dd/MM", { locale: vi })} - ${format(
            weekDays[weekDays.length - 1],
            "dd/MM",
            { locale: vi },
          )}`}
        />

        <StatCard
          label="Đã booked"
          value={`${bookedCount}`}
          helper="Các ca đã có học viên đặt lịch"
        />

        <StatCard
          label="Chưa booked"
          value={`${availableCount}`}
          helper="Các ca còn trống để học viên đặt"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-black text-foreground">
              Lịch dạy trong tuần
            </h2>
            <p className="text-sm text-muted-foreground">
              Hiển thị theo từng giờ trong 7 ngày.
            </p>
          </div>
        </div>

        {isLoading || isFetching ? (
          <div className="flex h-[640px] items-center justify-center text-muted-foreground">
            Đang tải lịch dạy...
          </div>
        ) : isError ? (
          <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm text-destructive">
            Không tải được lịch dạy của giáo viên.
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="max-h-[calc(100vh-320px)] overflow-auto"
          >
            <div className="min-w-[1450px]">
              <div
                className="sticky top-0 z-20 grid border-b border-border bg-card"
                style={{
                  gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(180px, 1fr))`,
                }}
              >
                <div className="border-r border-border px-3 py-4 text-sm font-semibold text-muted-foreground">
                  Giờ
                </div>

                {weekDays.map((day) => {
                  const active = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border-r border-border px-4 py-4 last:border-r-0",
                        active && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "text-4xl font-light leading-none tracking-tight",
                          active ? "text-primary" : "text-foreground",
                        )}
                      >
                        {format(day, "d", { locale: vi })}
                      </div>

                      <div
                        className={cn(
                          "mt-1 text-sm capitalize",
                          active
                            ? "font-semibold text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {format(day, "EEEE", { locale: vi })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(180px, 1fr))`,
                }}
              >
                <div className="border-r border-border bg-background/40">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="relative border-b border-dashed border-border/70"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      <span className="absolute right-3 top-0 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        {hour}h
                      </span>
                    </div>
                  ))}
                </div>

                {weekDays.map((day) => {
                  const dayKey = toYmd(day);
                  const daySlots = slotsByDate.get(dayKey) ?? [];

                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        "relative border-r border-border last:border-r-0",
                        isToday(day) && "bg-primary/5",
                      )}
                      style={{ height: totalGridHeight }}
                    >
                      {hours.map((hour) => (
                        <div
                          key={`${dayKey}-${hour}`}
                          className="border-b border-dashed border-border/70"
                          style={{ height: HOUR_HEIGHT }}
                        />
                      ))}

                      {daySlots.map((slot) => (
                        <ScheduleEvent
                          key={slot.timeSlotId}
                          slot={slot}
                          startHour={hourRange.start}
                          onEdit={(s) => setEditTarget(s)}
                          onDelete={(s) => setDeleteTarget(s)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa slot trống?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Khung ${formatTimeRange(
                    deleteTarget.startAt,
                    deleteTarget.endAt,
                  )} sẽ bị gỡ khỏi lịch. Không thể hoàn tác.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl font-bold"
              disabled={deletingSlot}
              onClick={() => void handleConfirmDelete()}
            >
              {deletingSlot ? "Đang xóa..." : "Xóa slot"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa lịch rảnh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="slot-start">Giờ bắt đầu</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">Giờ kết thúc</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-price">Học phí (Hoa)</Label>
              <Input
                id="slot-price"
                type="number"
                min={1}
                step={1}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-subject">Chủ đề / môn</Label>
              <Input
                id="slot-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditTarget(null)}
            >
              Hủy
            </Button>
            <Button
              className="rounded-xl font-bold"
              disabled={updatingSlot}
              onClick={() => void handleSaveEdit()}
            >
              {updatingSlot ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
