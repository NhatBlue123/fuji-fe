"use client";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useGetStudentProfileQuery } from "@/store/services/bookingApi";
import type { TeacherScheduleSlot } from "@/types/booking";

type StudentProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: TeacherScheduleSlot | null;
};

function formatGender(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    default:
      return "Khác";
  }
}

function formatJoinedAt(value?: string) {
  if (!value) return "Chưa rõ";
  return new Date(value).toLocaleDateString("vi-VN", {
    month: "2-digit",
    year: "numeric",
  });
}

function formatFullDateTime(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const dateLabel = start.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(
    start.getMinutes()
  ).padStart(2, "0")} - ${String(end.getHours()).padStart(2, "0")}:${String(
    end.getMinutes()
  ).padStart(2, "0")}`;

  return `${dateLabel} • ${timeLabel}`;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-secondary">{icon}</span>
        <span className="text-xs uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-2 text-base font-black tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function StudentProfileDialog({
  open,
  onOpenChange,
  slot,
}: StudentProfileDialogProps) {
  const studentId = slot?.studentId;

  const { data: profile, isFetching } = useGetStudentProfileQuery(
    { studentId: studentId ?? 0 },
    { skip: !open || !studentId }
  );

  if (!slot) return null;

  const displayName = profile?.fullName || slot.studentName || "Học viên";
  const avatarUrl = profile?.avatarUrl || "/images/avt-default.jpg";
  const bio =
    profile?.bio?.trim() ||
    "Học viên chưa cập nhật phần giới thiệu. Bạn có thể xem thông tin buổi học đã book ngay trong cửa sổ này.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-0 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur">
        <DialogHeader className="sr-only">
          <DialogTitle>Hồ sơ học viên</DialogTitle>
          <DialogDescription>Thông tin cơ bản của học viên đã book slot này.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent" />
          <div className="pointer-events-none absolute -left-10 top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 top-4 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative p-6 md:p-8">
            
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 rounded-[1.5rem] object-cover ring-4 ring-secondary/10"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
                      {slot.subject || "Buổi học đã book"}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/70"
                    >
                      {slot.bookingStatus || "CONFIRMED"}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                    {displayName}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    @{profile?.username || slot.studentName || "student"}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {isFetching ? "Đang tải thông tin học viên..." : bio}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<CalendarDays className="size-4" />}
                label="Buổi học"
                value={new Date(slot.startAt).toLocaleDateString("vi-VN")}
              />
              <StatCard
                icon={<Clock3 className="size-4" />}
                label="Khung giờ"
                value={formatFullDateTime(slot.startAt, slot.endAt)}
              />
              <StatCard
                icon={<BookOpen className="size-4" />}
                label="Môn học"
                value={slot.subject || "Buổi học"}
              />
              <StatCard
                icon={<GraduationCap className="size-4" />}
                label="Tham gia"
                value={formatJoinedAt(profile?.createdAt)}
              />
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-5">
                <div className="text-sm font-semibold text-foreground">
                  Thông tin booking của học viên
                </div>

                <div className="mt-4 space-y-3">
                  <InfoRow
                    label="Học viên book"
                    value={slot.studentName || "Không rõ"}
                  />
                  <InfoRow
                    label="Thời lượng"
                    value={`${slot.durationMinutes} phút`}
                  />
                  <InfoRow
                    label="Trạng thái booking"
                    value={slot.bookingStatus || "CONFIRMED"}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <InfoRow
                  label="Tên đăng nhập"
                  value={`@${profile?.username || slot.studentName || "student"}`}
                />
                <InfoRow
                  label="JLPT"
                  value={profile?.jlptLevel ? `Tiếng Nhật ${profile.jlptLevel}` : "Chưa cập nhật"}
                />
                <InfoRow
                  label="Giới tính"
                  value={profile?.gender ? formatGender(profile.gender) : "Chưa cập nhật"}
                />
                <InfoRow
                  label="Trạng thái"
                  value={profile?.active ? "Tài khoản hoạt động" : "Tạm ẩn"}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-border/70 pt-5">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
