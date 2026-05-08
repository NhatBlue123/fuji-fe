import type { Metadata } from "next";

export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Flashcard tiếng Nhật | FUJI",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  title: "Flashcard tiếng Nhật | FUJI",
  description:
    "Học từ vựng tiếng Nhật bằng flashcard thông minh theo cấp độ JLPT N5-N1 trên FUJI.",
  alternates: {
    canonical: "https://fuji.io.vn/flashcards",
  },
  openGraph: {
    title: "Flashcard tiếng Nhật | FUJI",
    description:
      "Học từ vựng tiếng Nhật bằng flashcard thông minh theo cấp độ JLPT N5-N1.",
    url: "https://fuji.io.vn/flashcards",
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flashcard tiếng Nhật | FUJI",
    description: "Học từ vựng tiếng Nhật bằng flashcard thông minh.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
