import { MetadataRoute } from "next";
import { fetchPublishedCourses } from "@/lib/publicApi";

// Revalidate sitemap every 24 hours (crawlers fetch infrequently)
export const revalidate = 86400;

const BASE_URL = "https://fuji.io.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/course`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jlpt-practice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/premium`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic course pages — fetch all published courses
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await fetchPublishedCourses({ size: 1000 });
    coursePages = courses
      .filter((c) => c.slug) // only include courses that have a slug
      .map((course) => ({
        url: `${BASE_URL}/course/${course.slug}-${course.id}`,
        lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // If the API is unavailable, return static pages only
    // The sitemap will be regenerated on the next revalidation cycle
  }

  return [...staticPages, ...coursePages];
}
