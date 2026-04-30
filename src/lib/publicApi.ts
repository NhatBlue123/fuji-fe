/**
 * Server-side fetch helpers for the unauthenticated public course API.
 * Used by Server Components (SSR), sitemap.ts, and generateMetadata().
 *
 * All fetches use Next.js ISR caching (revalidate: 3600 = 1 hour).
 * The backend URL is read from NEXT_PUBLIC_API_URL (server-side env var).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";

export interface PublicCourseDto {
  id: number;
  title: string;
  description: string | null;
  slug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  price: number;
  currency: string | null;
  studentCount: number;
  lessonCount: number;
  totalDuration: number;
  averageRating: number;
  ratingCount: number;
  jlptLevel: string | null;
  instructorId: number | null;
  instructorName: string | null;
  instructorAvatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  data: T;
  messageKey?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FetchCoursesParams {
  level?: string;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * Fetch all published courses (paginated).
 * Returns an empty array on error to avoid breaking SSR pages.
 */
export async function fetchPublishedCourses(
  params: FetchCoursesParams = {}
): Promise<PublicCourseDto[]> {
  try {
    const { level, search, page = 0, size = 100 } = params;
    const url = new URL(`${API_BASE}/public/courses`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    if (level && level !== "all") url.searchParams.set("level", level);
    if (search) {
      // Use search endpoint when keyword is provided
      const searchUrl = new URL(`${API_BASE}/public/courses/search`);
      searchUrl.searchParams.set("keyword", search);
      searchUrl.searchParams.set("page", String(page));
      searchUrl.searchParams.set("size", String(size));
      const res = await fetch(searchUrl.toString(), {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];
      const json: ApiResponse<PageResponse<PublicCourseDto>> = await res.json();
      return json.data?.content ?? [];
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json: ApiResponse<PageResponse<PublicCourseDto>> = await res.json();
    return json.data?.content ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single published course by ID.
 * Returns null if not found, unpublished, or on error.
 */
export async function fetchPublicCourse(
  id: number | string
): Promise<PublicCourseDto | null> {
  try {
    const res = await fetch(`${API_BASE}/public/courses/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json: ApiResponse<PublicCourseDto> = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
