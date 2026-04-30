import type { Metadata } from "next";

export const revalidate = 3600;

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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flashcard tiếng Nhật | FUJI",
    description: "Học từ vựng tiếng Nhật bằng flashcard thông minh.",
  },
};

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
