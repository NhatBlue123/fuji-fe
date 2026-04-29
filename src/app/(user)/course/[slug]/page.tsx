import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicCourse, type PublicCourseDto } from "@/lib/publicApi";
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import CourseDetailView from "@/components/user-component/course/CourseDetailView";
import type { CourseResponseDTO, UserSummaryDTO } from "@/types/course";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Extracts the trailing numeric course ID from a slug string.
 * Examples:
 *   "hoc-tieng-nhat-co-ban-42" → 42
 *   "42"                        → 42
 *   "hoc-tieng-nhat"            → null
 */
function extractCourseId(slug: string): number | null {
  const match = slug.match(/(?:^|-)(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function getCourseUrlSegment(course: { slug: string | null; id: number }) {
  return course.slug ? `${course.slug}-${course.id}` : String(course.id);
}

function toInitialCourse(course: PublicCourseDto): CourseResponseDTO {
  const instructor: UserSummaryDTO = {
    id: course.instructorId ?? 0,
    username: course.instructorName ?? "fuji",
    fullName: course.instructorName ?? "FUJI",
    avatarUrl: course.instructorAvatarUrl ?? "",
  };

  return {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    instructor,
    author: instructor,
    thumbnailUrl: course.thumbnailUrl,
    price: course.price ?? 0,
    studentCount: course.studentCount ?? 0,
    lessonCount: course.lessonCount ?? 0,
    totalDuration: course.totalDuration ?? 0,
    averageRating: course.averageRating ?? 0,
    ratingCount: course.ratingCount ?? 0,
    isPublished: true,
    jlptLevel: course.jlptLevel as CourseResponseDTO["jlptLevel"],
    createdAt: course.createdAt ?? new Date(0).toISOString(),
    updatedAt: course.updatedAt ?? new Date(0).toISOString(),
  };
}

/**
 * Generates Next.js metadata for the course detail page.
 * Falls back gracefully when the course is not found.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const courseId = extractCourseId(slug);
  if (courseId === null) return {};

  const course = await fetchPublicCourse(courseId);
  if (!course) return {};

  const rawTitle = course.seoTitle ?? course.title;
  const title = rawTitle.length > 60 ? rawTitle.slice(0, 60) : rawTitle;

  const description =
    course.seoDescription ?? (course.description?.slice(0, 160) ?? "");

  const canonicalUrl =
    course.canonicalUrl ??
    `https://fuji.io.vn/course/${getCourseUrlSegment(course)}`;

  const ogImage = course.thumbnailUrl
    ? {
        url: course.thumbnailUrl,
        width: 1200,
        height: 630,
        alt: course.thumbnailAlt ?? course.title,
      }
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      locale: "vi_VN",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage.url] } : {}),
    },
  };
}

/**
 * Server Component — Course detail page at /course/[slug].
 *
 * The slug must end with the numeric course ID (e.g. "hoc-tieng-nhat-42").
 * If the slug does not match the canonical form stored on the course record,
 * this page calls notFound() as a defensive fallback — the middleware handles
 * the 301 redirect for legacy numeric-only URLs before this page is reached.
 */
export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  const courseId = extractCourseId(slug);
  if (courseId === null) notFound();

  const course = await fetchPublicCourse(courseId);
  if (!course) notFound();

  // Defensive canonical check: ensure the slug in the URL matches the
  // canonical slug stored on the course. The middleware issues a 301 redirect
  // for numeric-only paths; this notFound() is a safety net for malformed slugs.
  const canonicalSlug = getCourseUrlSegment(course);
  if (slug !== canonicalSlug && slug !== String(course.id)) notFound();

  return (
    <>
      <CourseJsonLd course={course} />
      <BreadcrumbJsonLd course={course} />
      <CourseDetailView courseId={course.id} initialCourse={toInitialCourse(course)} />
    </>
  );
}
