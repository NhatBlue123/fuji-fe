import type { PublicCourseDto } from "./types";

interface BreadcrumbItem {
  position: number;
  name: string;
  item: string;
}

interface BreadcrumbJsonLdProps {
  course: PublicCourseDto;
}

function getCourseUrlSegment(course: PublicCourseDto): string {
  return course.slug ? `${course.slug}-${course.id}` : String(course.id);
}

/**
 * Server Component that renders BreadcrumbList structured data as JSON-LD.
 *
 * Hierarchy:
 *   Home → Courses → [JLPT Level (optional)] → Course Title
 *
 * Phase 1/2: JLPT breadcrumb links to /JLPT_Practice?level={level}
 * Phase 3: Update to /jlpt/{level} when landing pages are created.
 *
 * Schema: https://schema.org/BreadcrumbList
 */
export function BreadcrumbJsonLd({ course }: BreadcrumbJsonLdProps) {
  const canonicalUrl =
    course.canonicalUrl ??
    `https://fuji.io.vn/course/${getCourseUrlSegment(course)}`;

  const items: BreadcrumbItem[] = [
    { position: 1, name: "Trang chủ", item: "https://fuji.io.vn" },
    { position: 2, name: "Khóa học", item: "https://fuji.io.vn/course" },
  ];

  if (course.jlptLevel) {
    // Phase 1/2: link to existing JLPT practice page with level filter
    // TODO Phase 3: change to https://fuji.io.vn/jlpt/{level.toLowerCase()}
    items.push({
      position: 3,
      name: `JLPT ${course.jlptLevel}`,
      item: `https://fuji.io.vn/JLPT_Practice?level=${course.jlptLevel.toLowerCase()}`,
    });
    items.push({
      position: 4,
      name: course.title,
      item: canonicalUrl,
    });
  } else {
    items.push({
      position: 3,
      name: course.title,
      item: canonicalUrl,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((breadcrumb) => ({
      "@type": "ListItem",
      position: breadcrumb.position,
      name: breadcrumb.name,
      item: breadcrumb.item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
