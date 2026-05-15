import type { Metadata } from "next";
import { fetchPublishedCourses } from "@/lib/publicApi";
import { CourseListServer } from "@/components/seo/CourseListServer";
import CourseListClient from "@/components/user-component/course/CourseListClient";
import { CoursePageHeroText } from "@/components/user-component/course/CoursePageI18nText";

export const dynamic = "force-static";
export const revalidate = 3600;

const COURSE_HERO_IMAGE_PATH = "/images/add18fd4-4014-464b-a78a-e0901a9aeafe.png";
const COURSE_HERO_IMAGE_URL = `https://fuji.io.vn${COURSE_HERO_IMAGE_PATH}`;

const DEFAULT_OG_IMAGE = {
  url: COURSE_HERO_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: "Khóa học tiếng Nhật | FUJI",
  type: "image/png",
};

export async function generateMetadata(): Promise<Metadata> {
  const title = "Khóa học tiếng Nhật | FUJI";
  const description =
    "Khám phá các khóa học tiếng Nhật từ N5 đến N1 trên FUJI. Học online với giáo viên chuyên nghiệp, luyện đề JLPT, AI Chat 24/7.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://fuji.io.vn/course",
    },
    openGraph: {
      title,
      description,
      url: "https://fuji.io.vn/course",
      siteName: "FUJI",
      locale: "vi_VN",
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

/**
 * Course list page — SSR content with a small client filter island.
 *
 * SSR layer (CourseListServer): renders initial course cards with all
 * indexable content (titles, descriptions, prices, ratings) visible in
 * the initial HTML for search engine crawlers.
 *
 * Client layer (CourseListClient): handles filter controls by updating
 * the URL. The server component then renders the matching course list.
 */
export default async function CoursePage() {
  // Fetch initial courses with ISR so /course remains a public SEO page.
  const initialCourses = await fetchPublishedCourses({
    size: 9,
  });

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth">
      {/* Hero Section — static, rendered server-side */}
      <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-secondary/10">
        <div className="absolute inset-0 z-0 opacity-50">
          <div
            className="w-full h-full bg-cover bg-bottom"
            style={{
              backgroundImage: `url('${COURSE_HERO_IMAGE_PATH}')`,
            }}
          />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <CoursePageHeroText />
        </div>
      </div>

      {/* Filter controls update the URL; the course grid below is rendered server-side. */}
      <CourseListClient
        initialLevel="all"
        initialSearch=""
        initialCategory="all"
      />

      <CourseListServer courses={initialCourses} />
    </div>
  );
}
