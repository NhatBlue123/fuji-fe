"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addWeeks, format, isToday, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { StudentProfileDialog } from "@/components/user-component/booking-instructor/StudentProfileDialog";

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
} from "@/components/UI/alert-dialog";
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

// --- FIX LỖI Ở COMPONENT NÀY ---
function ScheduleEvent({
  slot,
  startHour,
  onOpenStudentProfile,
  onEdit,
  onDelete,
}: {
  slot: TeacherScheduleSlot;
  startHour: number;
  onOpenStudentProfile: (slot: TeacherScheduleSlot) => void;
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
  const canEdit = !isLockedSlot && onEdit && new Date(slot.startAt) > new Date();
  const canDelete = !isLockedSlot && onDelete;

  return (
    <button
      type="button"
      onClick={() => {
        if (isBooked) onOpenStudentProfile(slot);
      }}
      title={isBooked ? `Học viên: ${slot.studentName ?? "Không rõ"}` : "Chưa có học viên đặt lịch"}
      className={cn(
        "absolute left-2 right-2 rounded-xl border px-3 py-2 text-left shadow-sm transition-colors",
        isBooked
          ? "border-primary/30 bg-primary/10 hover:bg-primary/20"
          : isCompleted
            ? "border-slate-400/30 bg-slate-400/10"
            : isNoShow
              ? "border-amber-500/30 bg-amber-500/10"
              : isCancelled
                ? "border-red-500/30 bg-red-500/10"
                : "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20",
      )}
      style={{ top, height }}
    >
      <div className="relative flex h-full flex-col justify-between gap-1 overflow-hidden">
        {/* Nút Edit/Delete chỉ hiện khi slot TRỐNG */}
        {!isLockedSlot && (canEdit || canDelete) && (
          <div
            className="absolute right-0 top-0 z-10 flex gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <button
                type="button"
                className="rounded-md border border-border/60 bg-background/90 p-1 text-foreground shadow-sm hover:bg-accent"
                onClick={() => onEdit?.(slot)}
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="rounded-md border border-border/60 bg-background/90 p-1 text-destructive shadow-sm hover:bg-destructive/10"
                onClick={() => onDelete?.(slot)}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 pr-10">
          <p className="text-[11px] font-bold text-foreground">
            {formatTimeRange(slot.startAt, slot.endAt)}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
          <p className="truncate text-sm font-bold text-foreground">
            {slot.subject}
          </p>

          {isLockedSlot ? (
            <>
              <div className="flex items-center gap-1 text-[10px] font-medium text-foreground">
                <User2 className={cn("size-3", isBooked ? "text-primary" : "text-slate-500")} />
                <span className="truncate">{slot.status}</span>
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                HV: {slot.studentName ?? "Không rõ"}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock3 className="size-3 text-emerald-500" />
              <span>Trống</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function TeachingSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<TeacherScheduleSlot | null>(null);
  const [editTarget, setEditTarget] = useState<TeacherScheduleSlot | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [deleteTimeSlot, { isLoading: deletingSlot }] = useDeleteTimeSlotMutation();
  const [updateTimeSlot, { isLoading: updatingSlot }] = useUpdateTimeSlotMutation();

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const fromDate = useMemo(() => toYmd(weekDays[0]), [weekDays]);
  const toDate = useMemo(() => toYmd(weekDays[6]), [weekDays]);

  const { data, isLoading, isFetching, isError } = useGetMyTeacherScheduleQuery(
    { fromDate, toDate },
    { refetchOnFocus: true, refetchOnReconnect: true },
  );

  const [selectedBookedSlot, setSelectedBookedSlot] = useState<TeacherScheduleSlot | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);

  const openStudentProfile = (slot: TeacherScheduleSlot) => {
    if (slot.status !== "BOOKED" || !slot.studentId) return;
    setSelectedBookedSlot(slot);
    setShowStudentProfile(true);
  };

  const groups = data?.items ?? [];
  const slotsByDate = useMemo(() => {
    return new Map(groups.map((group) => [group.date, group.slots]));
  }, [groups]);

  const allSlots = useMemo(() => groups.flatMap((group) => group.slots), [groups]);
  const bookedCount = useMemo(() => allSlots.filter((s) => s.status === "BOOKED").length, [allSlots]);
  const availableCount = allSlots.length - bookedCount;

  const hourRange = useMemo(() => {
    if (allSlots.length === 0) return { start: 6, end: 22 };
    let minH = 23, maxH = 0;
    allSlots.forEach((slot) => {
      const s = new Date(slot.startAt).getHours();
      const e = new Date(slot.endAt).getHours() + (new Date(slot.endAt).getMinutes() > 0 ? 1 : 0);
      minH = Math.min(minH, s);
      maxH = Math.max(maxH, e);
    });
    return { start: Math.max(0, minH - 1), end: Math.min(24, maxH + 1) };
  }, [allSlots]);

  const hours = useMemo(
    () => Array.from({ length: hourRange.end - hourRange.start }, (_, i) => hourRange.start + i),
    [hourRange],
  );

  const totalGridHeight = hours.length * HOUR_HEIGHT;

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
      alert("Lỗi: Không xóa được slot.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const price = Number(editPrice);
    if (isNaN(price) || price <= 0) return alert("Học phí không hợp lệ.");
    if (!editSubject.trim()) return alert("Vui lòng nhập chủ đề.");

    const slotDate = new Date(editTarget.startAt);
    const datePrefix = toYmd(slotDate);

    try {
      await updateTimeSlot({
        id: editTarget.timeSlotId,
        price,
        subject: editSubject.trim(),
        startAt: `${datePrefix}T${editStartTime}:00`,
        endAt: `${datePrefix}T${editEndTime}:00`,
      }).unwrap();
      setEditTarget(null);
    } catch {
      alert("Cập nhật thất bại. Vui lòng kiểm tra lại thời gian.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lịch dạy giáo viên</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý các ca dạy và theo dõi học viên đặt lịch.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-xl font-bold">
              <Link href="/admin/teacher-schedules/create-slot"><Plus className="mr-2 size-4" />Nhập lịch rảnh</Link>
            </Button>
            <Button variant="outline" onClick={() => setSelectedDate(new Date())}>Hôm nay</Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addWeeks(prev, -1))}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addWeeks(prev, 1))}><ChevronRight /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Tổng slot tuần" value={`${allSlots.length}`} helper="Tất cả các ca dạy" />
        <StatCard label="Đã booked" value={`${bookedCount}`} helper="Đã có học viên" />
        <StatCard label="Chưa booked" value={`${availableCount}`} helper="Đang đợi học viên" />
      </div>

      {/* Calendar Section */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">Đang tải...</div>
        ) : (
          <div ref={scrollRef} className="max-h-[70vh] overflow-auto">
            <div className="min-w-[1200px]">
              {/* Day Headers */}
              <div className="sticky top-0 z-20 grid border-b bg-card" style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, 1fr)` }}>
                <div className="p-4 text-xs font-bold text-muted-foreground">GIỜ</div>
                {weekDays.map(day => (
                  <div key={day.toISOString()} className={cn("p-4 text-center border-l", isToday(day) && "bg-primary/5")}>
                    <div className={cn("text-2xl font-black", isToday(day) && "text-primary")}>{format(day, "d")}</div>
                    <div className="text-xs uppercase opacity-60">{format(day, "EEEE", { locale: vi })}</div>
                  </div>
                ))}
              </div>

              {/* Grid Content */}
              <div className="grid" style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, 1fr)` }}>
                <div className="border-r bg-muted/10">
                  {hours.map(h => (
                    <div key={h} style={{ height: HOUR_HEIGHT }} className="relative border-b border-dashed text-[10px] text-right pr-2 pt-1 text-muted-foreground">{h}:00</div>
                  ))}
                </div>
                {weekDays.map(day => {
                  const dayKey = toYmd(day);
                  const daySlots = slotsByDate.get(dayKey) ?? [];
                  return (
                    <div key={dayKey} className={cn("relative border-r last:border-r-0", isToday(day) && "bg-primary/5")} style={{ height: totalGridHeight }}>
                      {hours.map(h => <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-dashed" />)}
                      {daySlots.map(slot => (
                        <ScheduleEvent
                          key={slot.timeSlotId}
                          slot={slot}
                          startHour={hourRange.start}
                          onOpenStudentProfile={openStudentProfile}
                          onEdit={setEditTarget}
                          onDelete={setDeleteTarget}
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

      {/* Dialogs */}
      <StudentProfileDialog open={showStudentProfile} onOpenChange={setShowStudentProfile} slot={selectedBookedSlot} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa slot?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletingSlot}>Xóa</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sửa thông tin slot</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bắt đầu</Label>
                <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc</Label>
                <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Học phí (Hoa)</Label>
              <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Chủ đề</Label>
              <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={updatingSlot}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}