"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useGetAllCoursesQuery,
  usePurchaseCourseMutation,
} from "@/store/services/courseApi";
import type { CourseResponseDTO } from "@/types/course";
import { useAuth } from "@/store/hooks";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop";

const PAGE_SIZE = 9;
const BLOSSOM_RATE = 1000;

function normalizePrice(price: unknown): number {
  const value = Number(price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isFreePrice(price: unknown): boolean {
  return normalizePrice(price) <= 0;
}

function toBlossomAmount(price: unknown): number {
  return Math.floor(normalizePrice(price) / BLOSSOM_RATE);
}

function formatPrice(price: unknown): string {
  const value = normalizePrice(price);
  if (isFreePrice(value)) return "Miễn phí";
  return `${toBlossomAmount(value).toLocaleString("vi-VN")} �`;
}

// ─── Skeleton ──────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col h-full animate-pulse">
      <div className="h-48 bg-muted"></div>
      <div className="p-5 flex flex-col flex-1">
        <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-muted rounded mb-2 w-full"></div>
        <div className="h-4 bg-muted rounded mb-4 w-5/6"></div>
        <div className="mt-auto pt-3 border-t border-border flex gap-4">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 h-10 bg-muted rounded-lg"></div>
          <div className="flex-1 h-10 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

// ─── Course Card ───────────────────────────────────────

function UserCourseCard({
  course,
  onRegister,
  registeringCourseId,
}: {
  course: CourseResponseDTO;
  onRegister: (course: CourseResponseDTO) => void;
  registeringCourseId: number | null;
}) {
  const thumbnail = course.thumbnailUrl || DEFAULT_THUMBNAIL;
  const isEnrolled = Boolean(course.isEnrolled);
  const isRegistering = registeringCourseId === course.id;
  const freeCourse = isFreePrice(course.price);
  const actionLabel = isEnrolled
    ? "Tiếp tục học"
    : freeCourse
      ? "Đăng ký miễn phí"
      : "Đăng ký";

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border card-hover-effect group flex flex-col h-full hover:shadow-xl transition-all duration-300">
      {/* Thumbnail */}
      <div className="h-48 relative overflow-hidden">
        <Image
          src={thumbnail}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80"></div>

        {/* Price badge */}
        <div className="absolute top-3 left-3 bg-secondary/90 backdrop-blur text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
          {formatPrice(course.price)}
        </div>

        {/* Rating badge */}
        {course.ratingCount > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm">
            <span className="material-symbols-outlined text-sm filled">
              star
            </span>{" "}
            {Number(course.averageRating).toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-secondary transition-colors line-clamp-1">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Stats */}
        <div className="mt-auto pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {course.lessonCount} bài học
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {course.studentCount > 1000
              ? `${(course.studentCount / 1000).toFixed(1)}k`
              : course.studentCount}{" "}
            học viên
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/course/${course.id}`}
            className="flex-1 py-2.5 rounded-lg border border-input text-center text-muted-foreground font-bold hover:bg-muted hover:text-foreground hover:border-border transition-colors text-sm"
          >
            Chi tiết
          </Link>
          <Button
            onClick={() => onRegister(course)}
            disabled={isRegistering}
            className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 text-sm hover:shadow-secondary/40"
          >
            {isRegistering ? "Đang xử lý..." : actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
        search_off
      </span>
      <p className="text-lg font-medium text-muted-foreground">
        Không tìm thấy khóa học nào
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Hãy thử tìm kiếm với từ khóa khác
      </p>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function PaginationControls({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="rounded-xl"
      >
        Trước
      </Button>
      <div className="min-w-[120px] text-center text-sm font-medium text-muted-foreground">
        Trang {page} / {Math.max(totalPages, 1)}
      </div>
      <Button
        variant="outline"
        onClick={onNext}
        disabled={!hasNext}
        className="rounded-xl"
      >
        Sau
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────

interface CourseListProps {
  searchKeyword?: string;
  level?: string;
  category?: "all" | "free" | "paid" | "mine";
}

export default function CourseList({
  searchKeyword,
  level = "all",
  category = "all",
}: CourseListProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [registeringCourseId, setRegisteringCourseId] = useState<number | null>(
    null,
  );
  const [purchaseCourse] = usePurchaseCourseMutation();

  const normalizedKeyword = searchKeyword?.trim() || "";
  const isSearching = normalizedKeyword.length > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, level, category]);

  const { data, isLoading, isFetching } = useGetAllCoursesQuery({
    page: currentPage - 1,
    size: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
    keyword: normalizedKeyword || undefined,
    level,
    category: category as "all" | "free" | "paid" | "mine",
  });

  const courses = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const safeTotalPages = Math.max(totalPages, 1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleRegister = async (course: CourseResponseDTO) => {
    const isEnrolled = Boolean(course.isEnrolled);

    if (isEnrolled) {
      if (course.currentLessonId) {
        router.push(`/course/${course.id}/lesson/${course.currentLessonId}`);
      } else {
        router.push(`/course/${course.id}`);
      }
      return;
    }

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học.");
      router.push("/login");
      return;
    }

    if (!isFreePrice(course.price)) {
      router.push(`/course/${course.id}`);
      return;
    }

    try {
      setRegisteringCourseId(course.id);
      await purchaseCourse({ courseId: course.id }).unwrap();
      toast.success("Đăng ký khóa học miễn phí thành công.");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; error?: string };
      const message =
        err?.data?.message || err?.error || "Không thể đăng ký khóa học.";
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("already purchased")
      ) {
        toast.info("Bạn đã đăng ký khóa học này trước đó.");
      } else {
        toast.error(message);
      }
    } finally {
      setRegisteringCourseId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              auto_awesome
            </span>
            {isSearching ? "Kết quả tìm kiếm" : "Khóa học nổi bật"}
          </h2>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalElements} khóa học
              {isSearching ? ` cho "${searchKeyword}"` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`size-8 rounded-full ${
              viewMode === "grid"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            } border border-input flex items-center justify-center hover:border-border transition-all`}
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`size-8 rounded-full ${
              viewMode === "list"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            } border border-input flex items-center justify-center hover:border-border transition-all`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* Course Grid */}
      <div
        className={`grid gap-8 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        } ${isFetching && !isLoading ? "opacity-60 transition-opacity" : ""}`}
      >
        {isLoading ? (
          Array.from({ length: PAGE_SIZE }).map((_, idx) => (
            <CourseCardSkeleton key={idx} />
          ))
        ) : courses.length === 0 ? (
          <EmptyState />
        ) : (
          courses.map((course) => (
            <UserCourseCard
              key={course.id}
              course={course}
              onRegister={handleRegister}
              registeringCourseId={registeringCourseId}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <PaginationControls
        page={currentPage}
        totalPages={safeTotalPages}
        hasPrevious={currentPage > 1}
        hasNext={currentPage < safeTotalPages}
        onPrevious={() => handlePageChange(Math.max(currentPage - 1, 1))}
        onNext={() =>
          handlePageChange(
            currentPage < safeTotalPages ? currentPage + 1 : currentPage,
          )
        }
      />
    </div>
  );
}
