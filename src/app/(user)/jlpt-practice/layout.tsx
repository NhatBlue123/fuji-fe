import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Luyện đề JLPT N5-N1 | FUJI",
  description:
    "Luyện thi JLPT N5, N4, N3, N2, N1 với hàng trăm đề thi thử trên FUJI. Đề thi đầy đủ 4 kỹ năng: từ vựng, ngữ pháp, đọc hiểu, nghe hiểu.",
  alternates: {
    canonical: "https://fuji.io.vn/jlpt-practice",
  },
  openGraph: {
    title: "Luyện đề JLPT N5-N1 | FUJI",
    description:
      "Luyện thi JLPT N5, N4, N3, N2, N1 với hàng trăm đề thi thử trên FUJI.",
    url: "https://fuji.io.vn/jlpt-practice",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luyện đề JLPT N5-N1 | FUJI",
    description: "Luyện thi JLPT N5, N4, N3, N2, N1 với hàng trăm đề thi thử.",
  },
};

export default function JLPTPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
