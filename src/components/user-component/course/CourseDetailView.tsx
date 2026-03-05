"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useGetCourseByIdQuery,
  useGetLessonsByCourseQuery,
  useGetCourseRatingsQuery,
  useGetAllCoursesQuery,
} from "@/store/services/courseApi";
import type { LessonResponseDTO, RatingResponseDTO } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Helpers ───────────────────────────────────────────

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

function renderStars(rating: number) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  for (let i = 0; i < full; i++)
    stars.push(
      <span key={`f${i}`} className="material-symbols-outlined text-lg filled">
        star
      </span>,
    );
  if (hasHalf)
    stars.push(
      <span key="h" className="material-symbols-outlined text-lg filled">
        star_half
      </span>,
    );
  for (let i = 0; i < empty; i++)
    stars.push(
      <span
        key={`e${i}`}
        className="material-symbols-outlined text-lg text-muted-foreground/40"
      >
        star
      </span>,
    );
  return stars;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Hôm nay";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

// ─── Tabs ──────────────────────────────────────────────

type TabId = "overview" | "curriculum" | "instructor" | "reviews";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "curriculum", label: "Chương trình" },
  { id: "instructor", label: "Giảng viên" },
  { id: "reviews", label: "Đánh giá" },
];

// ─── Skeleton ──────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-[400px] bg-muted" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-80 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Item ───────────────────────────────────────

function LessonItem({
  lesson,
  index,
  courseId,
}: {
  lesson: LessonResponseDTO;
  index: number;
  courseId: number;
}) {
  const isVideo = lesson.lessonType === "video";

  return (
    <Link
      href={`/course/${courseId}/lesson/${lesson.id}`}
      className="p-4 pl-6 md:pl-14 hover:bg-accent/30 transition-colors flex items-center justify-between group cursor-pointer block"
    >
      <div className="flex items-center gap-4">
        <div
          className={`size-10 rounded-full flex items-center justify-center transition-all ${
            lesson.userCompleted
              ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
              : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground border border-border group-hover:border-primary"
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {isVideo ? "play_arrow" : "assignment"}
          </span>
        </div>
        <div>
          <h4 className="text-foreground font-bold text-sm group-hover:text-secondary transition-colors">
            Bài {index + 1}: {lesson.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            {isVideo && lesson.duration > 0 && (
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">
                  schedule
                </span>{" "}
                {formatDuration(lesson.duration)}
              </span>
            )}
            {!isVideo && lesson.taskType && (
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">
                  quiz
                </span>{" "}
                {lesson.taskType.replace("_", " ")}
              </span>
            )}
            {lesson.userCompleted && (
              <span className="text-green-500 text-[10px] font-bold px-1.5 py-0.5 bg-green-500/10 rounded border border-green-500/20">
                Đã học
              </span>
            )}
          </div>
        </div>
      </div>
      {!lesson.userCompleted && (
        <span className="bg-muted hover:bg-secondary hover:text-secondary-foreground text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:border-secondary transition-all opacity-0 group-hover:opacity-100">
          {isVideo ? "Xem" : "Làm bài"}
        </span>
      )}
    </Link>
  );
}

// ─── Review Card ───────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-600 border-indigo-400",
  "bg-emerald-600 border-emerald-400",
  "bg-rose-600 border-rose-400",
  "bg-amber-600 border-amber-400",
  "bg-cyan-600 border-cyan-400",
  "bg-violet-600 border-violet-400",
];

function ReviewCard({ review }: { review: RatingResponseDTO }) {
  const colorClass = AVATAR_COLORS[review.user.id % AVATAR_COLORS.length];

  return (
    <div className="bg-card/30 rounded-2xl p-6 border border-border hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`size-12 rounded-full overflow-hidden flex-shrink-0 shadow-sm ${
            review.user.avatarUrl
              ? "bg-muted border border-border"
              : `${colorClass} flex items-center justify-center text-white font-bold text-lg`
          }`}
        >
          {review.user.avatarUrl ? (
            <Image
              src={review.user.avatarUrl}
              alt={review.user.fullName}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            review.user.fullName?.[0] || "U"
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h4 className="font-bold text-foreground text-sm">
                {review.user.fullName}
              </h4>
              <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full mt-1 inline-block border border-secondary/20">
                Học viên mua khóa học
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo(review.createdAt)}
            </span>
          </div>
          <div className="flex text-yellow-500 text-sm mb-3 mt-1">
            {renderStars(review.rating)}
          </div>
          {review.review && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {review.review}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────

function OverviewContent({ description }: { description: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
          <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined">info</span>
          </span>
          Giới thiệu khóa học
        </h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Bạn sẽ học được gì?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Nắm vững kiến thức nền tảng",
            "Phát triển kỹ năng giao tiếp",
            "Ôn luyện bài bản với hệ thống bài tập",
            "Chứng chỉ hoàn thành khóa học",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3">
              <span className="material-symbols-outlined text-secondary text-lg mt-0.5 filled">
                check_circle
              </span>
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Curriculum Tab ────────────────────────────────────

function CurriculumContent({
  lessons,
  isLoading,
  courseId,
}: {
  lessons: LessonResponseDTO[];
  isLoading: boolean;
  courseId: number;
}) {
  const [expandedAll, setExpandedAll] = useState(true);

  const completed = lessons.filter((l) => l.userCompleted).length;
  const totalDuration = lessons.reduce((sum, l) => sum + l.duration, 0);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined">menu_book</span>
          </span>
          Nội dung khóa học
        </h2>
        <div className="hidden sm:block text-muted-foreground text-sm font-medium">
          <span className="text-foreground font-bold">{lessons.length}</span>{" "}
          bài giảng •{" "}
          <span className="text-foreground font-bold">
            {formatDuration(totalDuration)}
          </span>
        </div>
      </div>

      {/* Progress summary */}
      {completed > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
          <div className="size-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Tiến độ: {completed}/{lessons.length} bài học
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
              <div
                className="bg-gradient-to-r from-secondary to-secondary/80 h-1.5 rounded-full"
                style={{
                  width: `${(completed / lessons.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-secondary font-bold text-sm">
            {Math.round((completed / lessons.length) * 100)}%
          </span>
        </div>
      )}

      {/* Lessons list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
        <button
          onClick={() => setExpandedAll(!expandedAll)}
          className="w-full p-5 flex items-center justify-between bg-muted/50 border-b border-border hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-4">
            <span
              className={`material-symbols-outlined text-secondary transition-transform ${expandedAll ? "rotate-180" : ""}`}
            >
              expand_more
            </span>
            <div className="text-left">
              <h3 className="font-bold text-foreground text-lg">
                Tất cả bài học
              </h3>
              <p className="text-muted-foreground text-xs mt-1 font-medium">
                {completed}/{lessons.length} hoàn thành •{" "}
                {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
          {completed === lessons.length && lessons.length > 0 && (
            <div className="size-8 rounded-full border border-secondary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-lg">
                check
              </span>
            </div>
          )}
        </button>
        {expandedAll && (
          <div className="divide-y divide-border">
            {lessons.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 block">
                  inbox
                </span>
                Chưa có bài học nào
              </div>
            ) : (
              lessons.map((lesson, idx) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  index={idx}
                  courseId={courseId}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Instructor Tab ────────────────────────────────────

function InstructorContent({
  instructor,
  currentCourseId,
}: {
  instructor: {
    id: number;
    fullName: string;
    avatarUrl: string;
    username: string;
  };
  currentCourseId: number;
}) {
  // Fetch all courses to show other courses by this instructor
  const { data: allCoursesData } = useGetAllCoursesQuery({
    page: 0,
    size: 50,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const otherCourses = (allCoursesData?.content ?? []).filter(
    (c) => c.instructor.id === instructor.id && c.id !== currentCourseId,
  );

  // Aggregate stats from instructor's courses
  const instructorCourses = (allCoursesData?.content ?? []).filter(
    (c) => c.instructor.id === instructor.id,
  );
  const totalStudents = instructorCourses.reduce(
    (sum, c) => sum + c.studentCount,
    0,
  );
  const avgRating =
    instructorCourses.length > 0
      ? instructorCourses.reduce((sum, c) => sum + c.averageRating, 0) /
        instructorCourses.length
      : 0;

  return (
    <div className="space-y-12">
      {/* ── Profile Card ── */}
      <section>
        <div className="bg-card/50 border border-border rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
          {/* Watermark icon */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">
              school
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative group">
              <div className="size-32 rounded-full border-4 border-secondary/20 p-1 bg-card">
                {instructor.avatarUrl ? (
                  <Image
                    src={instructor.avatarUrl}
                    alt={instructor.fullName}
                    width={128}
                    height={128}
                    className="size-full rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="size-full rounded-full bg-muted flex items-center justify-center text-4xl font-black text-muted-foreground">
                    {instructor.fullName?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full border border-primary/60 flex items-center gap-1 shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-xs filled">
                  verified
                </span>{" "}
                Verified
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-3xl font-black text-foreground mb-1">
                  {instructor.fullName}
                </h2>
                <p className="text-secondary font-medium tracking-wide text-sm uppercase">
                  Giảng viên cao cấp tại FUJI
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="bg-muted/80 border border-border hover:border-muted-foreground/30 transition-colors text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-default">
                  <span className="material-symbols-outlined text-sm text-yellow-500 filled">
                    school
                  </span>{" "}
                  Giảng viên chuyên nghiệp
                </span>
                <span className="bg-muted/80 border border-border hover:border-muted-foreground/30 transition-colors text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-default">
                  <span className="material-symbols-outlined text-sm text-blue-400 filled">
                    translate
                  </span>{" "}
                  Tiếng Nhật
                </span>
                <span className="bg-muted/80 border border-border hover:border-muted-foreground/30 transition-colors text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-default">
                  <span className="material-symbols-outlined text-sm text-green-400 filled">
                    history_edu
                  </span>{" "}
                  Kinh nghiệm giảng dạy
                </span>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Giảng viên chuyên nghiệp tại nền tảng FUJI. Nhiều năm kinh
                nghiệm giảng dạy tiếng Nhật cho học viên Việt Nam. Phương pháp
                giảng dạy tập trung vào việc hiểu sâu bản chất ngôn ngữ và ứng
                dụng thực tế, giúp học viên không chỉ thi đỗ mà còn giao tiếp tự
                tin.
              </p>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 pt-4 border-t border-border mt-4">
                <div className="text-center">
                  <div className="text-foreground font-black text-xl">
                    {instructorCourses.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                    Khóa học
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-foreground font-black text-xl">
                    {totalStudents > 1000
                      ? `${(totalStudents / 1000).toFixed(1)}k`
                      : totalStudents}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                    Học viên
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-foreground font-black text-xl flex items-center gap-1">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    {avgRating > 0 && (
                      <span className="material-symbols-outlined text-sm text-yellow-500 filled">
                        star
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                    Đánh giá
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Other courses by instructor ── */}
      {otherCourses.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">
              collections_bookmark
            </span>
            Các khóa học khác của giảng viên
          </h3>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-none">
            {otherCourses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="min-w-[280px] w-[280px] bg-card rounded-xl overflow-hidden border border-border hover:border-secondary/50 transition-all duration-300 group snap-start shadow-lg hover:shadow-xl hover:shadow-secondary/10 flex flex-col"
              >
                <div className="h-40 bg-muted relative overflow-hidden">
                  <Image
                    src={c.thumbnailUrl || DEFAULT_THUMBNAIL}
                    alt={c.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20">
                    {c.price === 0 ? "Miễn phí" : formatPrice(c.price)}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="text-foreground font-bold mb-2 truncate group-hover:text-secondary transition-colors">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm text-yellow-500 filled">
                      star
                    </span>
                    <span className="text-xs text-foreground font-bold">
                      {Number(c.averageRating).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({c.ratingCount} đánh giá)
                    </span>
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-secondary font-bold text-sm">
                      {c.price === 0 ? "Miễn phí" : formatPrice(c.price)}
                    </span>
                    <span className="size-8 rounded-lg bg-muted hover:bg-secondary text-foreground hover:text-secondary-foreground flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-lg">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Reviews Tab ───────────────────────────────────────

function ReviewsContent({
  courseId,
  averageRating,
  ratingCount,
}: {
  courseId: number;
  averageRating: number;
  ratingCount: number;
}) {
  const { data: reviews, isLoading } = useGetCourseRatingsQuery(courseId);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Calculate rating distribution from reviews
  const distribution = [0, 0, 0, 0, 0]; // index 0..4 → 1-star..5-star
  if (reviews && reviews.length > 0) {
    for (const r of reviews) {
      const star = Math.round(r.rating);
      if (star >= 1 && star <= 5) distribution[star - 1]++;
    }
  }
  const totalRatings = reviews?.length || ratingCount || 1;
  const pct = distribution.map((cnt) => Math.round((cnt / totalRatings) * 100));

  // Sort reviews
  const sortedReviews = reviews
    ? [...reviews].sort((a, b) => {
        if (sortBy === "highest") return b.rating - a.rating;
        if (sortBy === "lowest") return a.rating - b.rating;
        // newest
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    : [];

  return (
    <div className="space-y-8">
      {/* ── Rating Summary ── */}
      <section className="bg-card/50 border border-border rounded-2xl p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">
            star_rate
          </span>
          Đánh giá từ học viên
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left — big score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r border-border md:pr-4">
            <div className="text-6xl font-black text-foreground mb-2">
              {Number(averageRating).toFixed(1)}
            </div>
            <div className="flex gap-1 text-yellow-500 mb-2">
              {renderStars(averageRating)}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {ratingCount.toLocaleString("vi-VN")} đánh giá
            </p>
          </div>

          {/* Right — bar chart */}
          <div className="md:col-span-8 space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const percent = pct[star - 1];
              const opacities: Record<number, string> = {
                5: "",
                4: "opacity-70",
                3: "opacity-50",
                2: "opacity-30",
                1: "opacity-20",
              };
              return (
                <div key={star} className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground w-8 font-medium">
                    {star} sao
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-secondary rounded-full ${star === 5 ? "shadow-[0_0_10px_rgba(244,114,182,0.5)]" : ""} ${opacities[star] || ""}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comment list ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">
            Bình luận nổi bật
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card border border-border rounded-lg text-sm text-muted-foreground px-3 py-2 focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              rate_review
            </span>
            Chưa có đánh giá nào
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Load more button */}
        {sortedReviews.length > 0 && (
          <Button className="w-full py-3 rounded-xl border border-border bg-card/50 text-muted-foreground font-bold hover:bg-card hover:text-foreground transition-all text-sm">
            Xem thêm đánh giá
          </Button>
        )}
      </section>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────

export default function CourseDetailView({ courseId }: { courseId: number }) {
  const [activeTab, setActiveTab] = useState<TabId>("curriculum");
  const [couponCode, setCouponCode] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useGetCourseByIdQuery(courseId);

  const { data: lessons = [], isLoading: lessonsLoading } =
    useGetLessonsByCourseQuery(courseId);

  // Sticky detection
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToContent = useCallback((tab: TabId) => {
    setActiveTab(tab);
    // Scroll to the content area
    const contentEl = document.getElementById("course-content");
    if (contentEl) {
      const offset =
        contentEl.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  if (courseLoading) return <DetailSkeleton />;

  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
          error
        </span>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Không tìm thấy khóa học
        </h2>
        <p className="text-muted-foreground mb-6">
          Khóa học này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/course"
          className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/90 transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const thumbnail = course.thumbnailUrl || DEFAULT_THUMBNAIL;
  const completedLessons = lessons.filter((l) => l.userCompleted).length;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────── */}
      <div className="relative w-full h-[400px] flex flex-col justify-end overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 z-0">
          <Image
            src={thumbnail}
            alt={course.title}
            fill
            className="object-cover blur-sm scale-105"
            priority
          />
          <div className="absolute inset-0 bg-background/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 pb-12 flex flex-col md:flex-row items-end gap-8">
          <div className="flex-1">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-secondary/90 backdrop-blur text-secondary-foreground text-xs font-bold rounded-lg border border-white/10 shadow-lg uppercase tracking-wider">
                {course.price === 0 ? "Miễn phí" : formatPrice(course.price)}
              </span>
              <span className="px-3 py-1 bg-white/10 backdrop-blur text-foreground/80 text-xs font-medium rounded-lg border border-white/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>{" "}
                Cập nhật{" "}
                {new Date(course.updatedAt).toLocaleDateString("vi-VN", {
                  month: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4 leading-tight text-glow">
              {course.title}
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {course.ratingCount > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                  <span className="text-xl">
                    {Number(course.averageRating).toFixed(1)}
                  </span>
                  <div className="flex">
                    {renderStars(Number(course.averageRating))}
                  </div>
                  <span className="text-muted-foreground font-normal ml-1">
                    ({course.ratingCount.toLocaleString()} đánh giá)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">group</span>
                <span>{course.studentCount.toLocaleString()} học viên</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">
                  language
                </span>
                <span>Tiếng Việt</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            {lessons.length > 0 ? (
              <Link
                href={`/course/${courseId}/lesson/${[...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder)[0].id}`}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-4 px-8 rounded-xl shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all transform hover:scale-105 flex items-center gap-2 text-lg"
              >
                <span className="material-symbols-outlined filled">
                  play_circle
                </span>
                Bắt đầu học ngay
              </Link>
            ) : (
              <button
                disabled
                className="bg-muted text-muted-foreground font-bold py-4 px-8 rounded-xl flex items-center gap-2 text-lg cursor-not-allowed"
              >
                <span className="material-symbols-outlined filled">
                  play_circle
                </span>
                Chưa có bài học
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs Navigation ─────────────────────────── */}
      <div
        ref={tabsRef}
        className={`sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-lg transition-shadow ${isSticky ? "shadow-xl" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <nav className="flex gap-8 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToContent(tab.id)}
                className={`py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-secondary font-bold border-b-2 border-secondary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────── */}
      <div
        id="course-content"
        className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-12">
            {activeTab === "overview" && (
              <OverviewContent description={course.description} />
            )}
            {activeTab === "curriculum" && (
              <CurriculumContent
                lessons={lessons}
                isLoading={lessonsLoading}
                courseId={courseId}
              />
            )}
            {activeTab === "instructor" && (
              <InstructorContent
                instructor={course.instructor}
                currentCourseId={courseId}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewsContent
                courseId={courseId}
                averageRating={course.averageRating}
                ratingCount={course.ratingCount}
              />
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                {/* Thumbnail preview */}
                <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 relative group cursor-pointer border border-border">
                  <Image
                    src={thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="size-14 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-3xl filled">
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-3xl font-black text-foreground mb-2">
                  {course.price === 0 ? (
                    <span className="text-secondary">Miễn phí</span>
                  ) : (
                    formatPrice(course.price)
                  )}
                </div>

                {/* Buttons */}
                <Button className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 mb-3 text-base">
                  {course.price === 0 ? "Đăng ký miễn phí" : "Mua ngay"}
                </Button>
                <Button variant="ghost" className="w-full py-3.5 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted hover:text-foreground hover:border-muted transition-colors text-sm">
                  Thêm vào yêu thích
                </Button>

                {/* Course Info */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">
                    Thông tin khóa học
                  </h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        menu_book
                      </span>{" "}
                      Bài học
                    </span>
                    <span className="text-foreground font-medium">
                      {course.lessonCount} bài giảng
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        timer
                      </span>{" "}
                      Thời lượng
                    </span>
                    <span className="text-foreground font-medium">
                      {formatDuration(course.totalDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        group
                      </span>{" "}
                      Học viên
                    </span>
                    <span className="text-foreground font-medium">
                      {course.studentCount.toLocaleString()}
                    </span>
                  </div>
                  {course.ratingCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">
                          star
                        </span>{" "}
                        Đánh giá
                      </span>
                      <span className="text-foreground font-medium">
                        {Number(course.averageRating).toFixed(1)} (
                        {course.ratingCount})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        card_membership
                      </span>{" "}
                      Chứng chỉ
                    </span>
                    <span className="text-foreground font-medium">Có</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        all_inclusive
                      </span>{" "}
                      Quyền truy cập
                    </span>
                    <span className="text-foreground font-medium">
                      Trọn đời
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-foreground font-bold text-sm mb-4">
                  Mã ưu đãi
                </h3>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="glass-input rounded-lg text-sm text-foreground px-3 py-2 w-full focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
                    placeholder="Nhập mã giảm giá"
                  />
                  <Button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-bold transition-colors">
                    Áp dụng
                  </Button>
                </div>
              </div>

              {/* Instructor mini */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4">
                  Giảng viên
                </h3>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0">
                    {course.instructor.avatarUrl ? (
                      <Image
                        src={course.instructor.avatarUrl}
                        alt={course.instructor.fullName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {course.instructor.fullName?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {course.instructor.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{course.instructor.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
