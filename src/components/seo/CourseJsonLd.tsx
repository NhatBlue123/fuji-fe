import type { PublicCourseDto } from "./types";

interface CourseJsonLdProps {
  course: PublicCourseDto;
}

function getCourseUrlSegment(course: PublicCourseDto): string {
  return course.slug ? `${course.slug}-${course.id}` : String(course.id);
}

/**
 * Converts total minutes to ISO 8601 duration string.
 * Examples: 90 → "PT1H30M", 45 → "PT45M", 120 → "PT2H"
 */
function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes || totalMinutes <= 0) return "PT0M";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `PT${hours}H${minutes}M`;
  if (hours > 0) return `PT${hours}H`;
  return `PT${minutes}M`;
}

/**
 * Server Component that renders Course structured data as JSON-LD.
 * Placed in the <head> via Next.js (rendered inside the page component).
 *
 * Schema: https://schema.org/Course
 * Google requirements: https://developers.google.com/search/docs/appearance/structured-data/course
 */
export function CourseJsonLd({ course }: CourseJsonLdProps) {
  const canonicalUrl =
    course.canonicalUrl ??
    `https://fuji.io.vn/course/${getCourseUrlSegment(course)}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? course.title,
    url: canonicalUrl,
    provider: {
      "@type": "Organization",
      name: "FUJI",
      url: "https://fuji.io.vn",
    },
    educationalLevel: course.jlptLevel ?? "Beginner",
    inLanguage: ["vi", "ja"],
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: formatDuration(course.totalDuration),
      },
    ],
    // Instructor — name only until public instructor profile pages exist
    instructor: {
      "@type": "Person",
      name: course.instructorName ?? "FUJI Instructor",
    },
  };

  // Conditional: offers (only when price > 0)
  if (course.price > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      price: course.price,
      priceCurrency: course.currency ?? "VND",
      availability: "https://schema.org/InStock",
    };
  }

  // Conditional: aggregateRating (only when there are ratings)
  if (course.ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: course.averageRating,
      ratingCount: course.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
