"use client";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Languages,
  Star,
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
import {
  useGetTeacherProfileQuery,
  useGetTeacherRatingQuery,
} from "@/store/services/bookingApi";

type TeacherPreview = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  primarySubjectLabel: string;
  subjectTypes: string[];
  levels: string[];
  slotCount: number;
  firstTimeLabel: string;
  previewTimes: string[];
};

type TeacherProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: TeacherPreview | null;
  onBook: () => void;
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

function formatRating(value?: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "Mới";
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
      <div className="mt-2 text-xl font-black tracking-tight text-foreground">
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

export function TeacherProfileDialog({
  open,
  onOpenChange,
  preview,
  onBook,
}: TeacherProfileDialogProps) {
  const teacherId = preview?.teacherId;

  const { data: profile, isFetching: fetchingProfile } = useGetTeacherProfileQuery(
    { teacherId: teacherId ?? 0 },
    { skip: !open || !teacherId }
  );

  const { data: rating } = useGetTeacherRatingQuery(
    { teacherId: teacherId ?? 0 },
    { skip: !open || !teacherId }
  );

  if (!preview) return null;

  const displayName = profile?.fullName || preview.teacherName;
  const avatarUrl =
    profile?.avatarUrl || preview.teacherAvatarUrl || "/images/avt-default.jpg";
  const bio =
    profile?.bio?.trim() ||
    "Giáo viên chưa cập nhật phần giới thiệu. Bạn có thể xem môn đang mở lịch và rating trước khi đặt buổi học.";
  const canBook = (profile?.active ?? true) && preview.slotCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-0 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur">
        <DialogHeader className="sr-only">
          <DialogTitle>Hồ sơ giáo viên</DialogTitle>
          <DialogDescription>Thông tin cơ bản của giáo viên trong luồng booking.</DialogDescription>
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
                    <Badge className="rounded-full bg-secondary/10 px-3 py-1 text-secondary hover:bg-secondary/10">
                      {preview.primarySubjectLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/70"
                    >
                      {profile?.active ? "Đang nhận lịch" : "Tạm ẩn"}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                    {displayName}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    @{profile?.username || "sensei"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-700"
                >
                  <Star className="mr-1 size-3.5 fill-current" />
                  {formatRating(rating?.averageRating)}/5
                </Badge>

                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-background/70 px-3 py-1"
                >
                  {rating?.totalReviews ?? 0} đánh giá
                </Badge>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {fetchingProfile ? "Đang tải thông tin giáo viên..." : bio}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Star className="size-4" />}
                label="Đánh giá"
                value={`${formatRating(rating?.averageRating)}/5`}
              />
              <StatCard
                icon={<BookOpen className="size-4" />}
                label="Slot mở"
                value={`${preview.slotCount}`}
              />
              <StatCard
                icon={<Clock3 className="size-4" />}
                label="Sớm nhất"
                value={preview.firstTimeLabel}
              />
              <StatCard
                icon={<CalendarDays className="size-4" />}
                label="Tham gia"
                value={formatJoinedAt(profile?.createdAt)}
              />
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="text-sm font-semibold text-foreground">Môn đang mở lịch</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.subjectTypes.map((subject) => (
                    <Badge
                      key={subject}
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/80 px-3 py-1"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 text-sm font-semibold text-foreground">Cấp độ phù hợp</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.levels.length > 0 ? (
                    preview.levels.map((level) => (
                      <Badge
                        key={level}
                        className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10"
                      >
                        {level}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Giáo viên chưa gắn cấp độ cụ thể.
                    </span>
                  )}
                </div>

                {preview.previewTimes.length > 0 && (
                  <>
                    <div className="mt-5 text-sm font-semibold text-foreground">Khung giờ nổi bật</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preview.previewTimes.map((time) => (
                        <span
                          key={time}
                          className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-3">
                <InfoRow label="Tên đăng nhập" value={`@${profile?.username || "sensei"}`} />
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
                  value={canBook ? "Có thể đặt lịch" : "Hiện chưa nhận lịch"}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Đóng
              </Button>

              <Button
                onClick={onBook}
                disabled={!canBook}
                className="rounded-xl bg-secondary font-bold text-secondary-foreground hover:bg-secondary/90"
              >
                Xem lịch và đặt buổi
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
