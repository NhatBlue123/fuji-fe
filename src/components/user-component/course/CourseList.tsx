"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  useGetAllCoursesQuery,
  useSearchCoursesQuery,
} from "@/store/services/courseApi";
import type { CourseResponseDTO } from "@/types/course";

// ─── Constants ─────────────────────────────────────────

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop";

const PAGE_SIZE = 9;

function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
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

function UserCourseCard({ course }: { course: CourseResponseDTO }) {
  const thumbnail = course.thumbnailUrl || DEFAULT_THUMBNAIL;

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
          <Button className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 text-sm hover:shadow-secondary/40">
            Đăng ký
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

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-12 flex justify-center">
      <nav className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">
            chevron_left
          </span>
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="text-muted-foreground px-1">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-9 h-9 rounded-lg font-bold transition-all ${
                currentPage === page
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </button>
      </nav>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────

interface CourseListProps {
  searchKeyword?: string;
}

export default function CourseList({ searchKeyword }: CourseListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isSearching = !!(searchKeyword && searchKeyword.trim());

  // Use search endpoint when keyword is provided, otherwise get all
  const allCoursesQuery = useGetAllCoursesQuery(
    {
      page: currentPage - 1,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "desc",
    },
    { skip: isSearching },
  );

  const searchQuery = useSearchCoursesQuery(
    { keyword: searchKeyword || "", page: currentPage - 1, size: PAGE_SIZE },
    { skip: !isSearching },
  );

  const activeQuery = isSearching ? searchQuery : allCoursesQuery;
  const { data, isLoading, isFetching } = activeQuery;

  const courses = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: "smooth" });
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
            <UserCourseCard key={course.id} course={course} />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
