import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Private paths that must never be indexed by search engines.
 * The proxy adds X-Robots-Tag: noindex, nofollow to all responses
 * for these paths. The HTML <meta name="robots"> tag is handled separately
 * via Next.js metadata exports in each route's layout.tsx.
 */
const PRIVATE_PATHS = [
  "/api",
  "/admin",
  "/booking",
  "/profile",
  "/settings",
  "/notifications",
  "/withdraw",
  "/learn",
  "/video-call",
  "/reports",
  "/oauth2",
  "/offline",
  "/payment",
  "/course/*/lesson",
  "/flashcards/detail/*/settings",
  "/flashcards/learn",
  "/flashcards/exercise",
  "/jlpt/result",
  "/jlpt-test",
  "/Exam",
  "/login",
  "/register",
];

/**
 * Backend API base URL, used for course slug lookups during URL canonicalization.
 * Must be an absolute URL accessible from the Next.js proxy runtime.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";

/**
 * Fetch the canonical slug for a course ID from the public API.
 * Returns null on any error so the proxy fails closed and passes through.
 */
async function fetchCourseSlug(
  courseId: string
): Promise<{ slug: string; id: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/public/courses/${courseId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const course = json?.data;
    if (!course?.slug || !course?.id) return null;
    return { slug: course.slug, id: course.id };
  } catch {
    return null;
  }
}

function slugifyVietnamese(input: string | null | undefined): string {
  const normalized = (input ?? "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "bo-tu-vung";
}

function extractTrailingId(slug: string): string | null {
  return slug.match(/(?:^|-)(\d+)$/)?.[1] ?? null;
}

function buildFlashcardSlug(flashcard: {
  id: number | string;
  name?: string | null;
  level?: string | null;
}): string {
  const level = slugifyVietnamese(flashcard.level ?? "tong-hop");
  const name = slugifyVietnamese(flashcard.name);
  return `tu-vung-${level}-${name}-${flashcard.id}`;
}

function buildFlashListSlug(flashList: {
  id: number | string;
  title?: string | null;
  level?: string | null;
}): string {
  const level = slugifyVietnamese(flashList.level ?? "tong-hop");
  const title = slugifyVietnamese(flashList.title);
  return `bo-tu-vung-${level}-${title}-${flashList.id}`;
}

async function fetchFlashcard(
  flashcardId: string
): Promise<{ id: number | string; name?: string | null; level?: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/flashcards/${flashcardId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const flashcard = json?.data;
    if (!flashcard?.id) return null;
    return {
      id: flashcard.id,
      name: flashcard.name,
      level: flashcard.level,
    };
  } catch {
    return null;
  }
}

async function fetchFlashList(
  flashListId: string
): Promise<{ id: number | string; title?: string | null; level?: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/flashlists/${flashListId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const flashList = json?.data;
    if (!flashList?.id) return null;
    return {
      id: flashList.id,
      title: flashList.title,
      level: flashList.level,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/JLPT_Practice" || pathname.startsWith("/JLPT_Practice/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/JLPT_Practice/, "/jlpt-practice");
    return NextResponse.redirect(url, { status: 301 });
  }

  if (pathname === "/Exam/JLPTtest" || pathname.startsWith("/Exam/JLPTtest/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/Exam\/JLPTtest/, "/jlpt-test");
    return NextResponse.redirect(url, { status: 301 });
  }

  const isPrivatePath = PRIVATE_PATHS.some((path) => {
    if (path.includes("*")) {
      const pattern = new RegExp(
        `^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\*", "[^/]+")}(?:/|$)`,
      );
      return pattern.test(pathname);
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  });

  if (isPrivatePath) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Canonicalize only course detail URLs with a single dynamic segment.
  // Do not match nested lesson routes such as /course/foo-123/lesson/456.
  const courseMatch = pathname.match(/^\/course\/([^/]+)$/);
  if (courseMatch) {
    const rawSlug = courseMatch[1];
    const idMatch = rawSlug.match(/(?:^|-)(\d+)$/);
    if (idMatch) {
      const courseId = idMatch[1];
      const course = await fetchCourseSlug(courseId);

      if (course) {
        const canonicalPath = `/course/${course.slug}-${course.id}`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  const flashcardDetailMatch = pathname.match(/^\/flashcards\/detail\/([^/]+)$/);
  if (flashcardDetailMatch) {
    const flashcardId = extractTrailingId(flashcardDetailMatch[1]);
    if (flashcardId) {
      const flashcard = await fetchFlashcard(flashcardId);
      if (flashcard) {
        const canonicalPath = `/flashcards/detail/${buildFlashcardSlug(flashcard)}`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  const flashcardSettingsMatch = pathname.match(
    /^\/flashcards\/detail\/([^/]+)\/settings$/
  );
  if (flashcardSettingsMatch) {
    const flashcardId = extractTrailingId(flashcardSettingsMatch[1]);
    if (flashcardId) {
      const flashcard = await fetchFlashcard(flashcardId);
      if (flashcard) {
        const canonicalPath = `/flashcards/detail/${buildFlashcardSlug(flashcard)}/settings`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  const flashcardLearnMatch = pathname.match(/^\/flashcards\/learn\/([^/]+)$/);
  if (flashcardLearnMatch) {
    const flashcardId = extractTrailingId(flashcardLearnMatch[1]);
    if (flashcardId) {
      const flashcard = await fetchFlashcard(flashcardId);
      if (flashcard) {
        const canonicalPath = `/flashcards/learn/${buildFlashcardSlug(flashcard)}`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  const flashcardExerciseMatch = pathname.match(
    /^\/flashcards\/exercise\/([^/]+)\/(multiple-choice|fill-blank)$/
  );
  if (flashcardExerciseMatch) {
    const flashcardId = extractTrailingId(flashcardExerciseMatch[1]);
    const exercise = flashcardExerciseMatch[2];
    if (flashcardId) {
      const flashcard = await fetchFlashcard(flashcardId);
      if (flashcard) {
        const canonicalPath = `/flashcards/exercise/${buildFlashcardSlug(flashcard)}/${exercise}`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  const flashListMatch = pathname.match(/^\/flashcards\/sets\/([^/]+)$/);
  if (flashListMatch) {
    const flashListId = extractTrailingId(flashListMatch[1]);
    if (flashListId) {
      const flashList = await fetchFlashList(flashListId);
      if (flashList) {
        const canonicalPath = `/flashcards/sets/${buildFlashListSlug(flashList)}`;
        if (pathname !== canonicalPath) {
          const url = request.nextUrl.clone();
          url.pathname = canonicalPath;
          return NextResponse.redirect(url, { status: 301 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
