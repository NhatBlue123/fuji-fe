/**
 * Home page — Server Component wrapper.
 *
 * This file exports Next.js metadata for SEO and renders the HomePageClient
 * component which contains the full interactive home page.
 *
 * The Organization and WebSite JSON-LD structured data are already included
 * in the root layout.tsx (fuji-fe/src/app/layout.tsx).
 */
import type { Metadata } from "next";
import HomePageClient from "@/components/user-component/home/HomePageClient";

export const dynamic = "force-static";
export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "FUJI - Nền tảng học tiếng Nhật All-in-One",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  title: "FUJI - Nền tảng học tiếng Nhật All-in-One",
  description:
    "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên, Flashcard thông minh. Nền tảng học tiếng Nhật toàn diện nhất Việt Nam.",
  alternates: {
    canonical: "https://fuji.io.vn",
  },
  openGraph: {
    title: "FUJI - Nền tảng học tiếng Nhật All-in-One",
    description:
      "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên.",
    url: "https://fuji.io.vn",
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "FUJI - Nền tảng học tiếng Nhật All-in-One",
    description:
      "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
