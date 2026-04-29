import Image from "next/image";
import Link from "next/link";
import type { PublicCourseDto } from "./types";

interface CourseDetailServerViewProps {
  course: PublicCourseDto;
}

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop";

const BLOSSOM_RATE = 1000;

function formatPrice(price: number | null | undefined): string {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "Miễn phí";
  return `${Math.floor(value / BLOSSOM_RATE).toLocaleString("vi-VN")} 🌸`;
}

function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes || totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

function getCourseUrlSegment(course: PublicCourseDto): string {
  return course.slug ? `${course.slug}-${course.id}` : String(course.id);
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-yellow-500" aria-label={`${rating.toFixed(1)} sao`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="material-symbols-outlined text-base filled">star</span>
      ))}
      {hasHalf && <span className="material-symbols-outlined text-base filled">star_half</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="material-symbols-outlined text-base text-muted-foreground/40">star</span>
      ))}
    </span>
  );
}

/**
 * Server Component — renders all SEO-indexable course content.
 *
 * This component receives pre-fetched PublicCourseDto and renders the primary
 * course information (title, description, instructor, stats, price) as static
 * HTML visible to search engine crawlers without JavaScript execution.
 *
 * Interactive actions (buy button, rating widget, coupon input) are handled
 * by a separate CoursePurchaseClient client component.
 *
 * Must NOT use RTK Query, useState, useEffect, or any client-side hooks.
 */
export function CourseDetailServerView({ course }: CourseDetailServerViewProps) {
  const canonicalUrl =
    course.canonicalUrl ??
    `https://fuji.io.vn/course/${getCourseUrlSegment(course)}`;

  return (
    <article className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
      {/* ── Hero Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Course Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* JLPT Level Badge */}
          {course.jlptLevel && (
            <div className="inline-flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full border border-secondary/20">
                JLPT {course.jlptLevel}
              </span>
            </div>
          )}

          {/* Course Title — h1 for SEO */}
          <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
            {course.title}
          </h1>

          {/* Course Description */}
          {course.description && (
            <p className="text-muted-foreground text-base leading-relaxed">
              {course.description}
            </p>
          )}

          {/* Rating & Stats Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {course.ratingCount > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={course.averageRating} />
                <span className="font-bold text-foreground">
                  {Number(course.averageRating).toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({course.ratingCount.toLocaleString("vi-VN")} đánh giá)
                </span>
              </div>
            )}
            {course.studentCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="material-symbols-outlined text-base">group</span>
                <span>{course.studentCount.toLocaleString("vi-VN")} học viên</span>
              </div>
            )}
            {course.lessonCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="material-symbols-outlined text-base">menu_book</span>
                <span>{course.lessonCount} bài học</span>
              </div>
            )}
            {course.totalDuration > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>{formatDuration(course.totalDuration)}</span>
              </div>
            )}
          </div>

          {/* Instructor */}
          {course.instructorName && (
            <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border">
              {course.instructorAvatarUrl ? (
                <Image
                  src={course.instructorAvatarUrl}
                  alt={course.instructorName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="size-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {course.instructorName[0]}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Giảng viên</p>
                <p className="font-bold text-foreground">{course.instructorName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Thumbnail & Price Card */}
        <div className="space-y-4">
          {/* Course Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <Image
              src={course.thumbnailUrl ?? DEFAULT_THUMBNAIL}
              alt={course.thumbnailAlt ?? course.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>

          {/* Price */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="text-3xl font-black text-foreground">
              {formatPrice(course.price)}
            </div>
            {course.price > 0 && (
              <p className="text-xs text-muted-foreground">
                Thanh toán bằng Blossom (🌸) — đơn vị tiền tệ nội bộ của FUJI
              </p>
            )}
            {/* Purchase actions are rendered by CoursePurchaseClient (client component) */}
            <div id="course-purchase-actions" />
          </div>
        </div>
      </div>

      {/* ── Breadcrumb Navigation ── */}
      <nav aria-label="Breadcrumb" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href="/course" className="hover:text-foreground transition-colors">Khóa học</Link>
        {course.jlptLevel && (
          <>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <Link
              href={`/JLPT_Practice?level=${course.jlptLevel.toLowerCase()}`}
              className="hover:text-foreground transition-colors"
            >
              JLPT {course.jlptLevel}
            </Link>
          </>
        )}
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
      </nav>

      {/* ── Course Description (full) ── */}
      {course.description && (
        <section className="mt-10" aria-labelledby="course-description-heading">
          <h2 id="course-description-heading" className="text-2xl font-bold text-foreground mb-4">
            Mô tả khóa học
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>
        </section>
      )}

      {/* ── Canonical link for internal navigation ── */}
      <div className="sr-only">
        <a href={canonicalUrl}>Liên kết chính thức của khóa học này</a>
      </div>
    </article>
  );
}
