import type { Metadata } from "next";
import { fetchPublishedCourses } from "@/lib/publicApi";
import { CourseListServer } from "@/components/seo/CourseListServer";
import CourseListClient from "@/components/user-component/course/CourseListClient";

export const dynamic = "force-static";
export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Khóa học tiếng Nhật | FUJI",
  type: "image/jpeg",
};

interface SearchParams {
  level?: string;
  search?: string;
  category?: string;
}

export async function generateMetadata({
  searchParams: _searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
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
export default async function CoursePage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')",
            }}
          />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Khóa học tiếng Nhật trên{" "}
            <span className="text-secondary text-glow">FUJI</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl md:max-w-2xl leading-relaxed">
            Học tiếng Nhật từ N5 đến N1 với giáo viên chuyên nghiệp, AI Chat
            24/7 và hệ thống luyện đề JLPT toàn diện.
          </p>
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
