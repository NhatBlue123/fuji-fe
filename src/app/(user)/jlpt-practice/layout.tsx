import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Luyện đề JLPT N5-N1 | FUJI",
  type: "image/jpeg",
};

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
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luyện đề JLPT N5-N1 | FUJI",
    description: "Luyện thi JLPT N5, N4, N3, N2, N1 với hàng trăm đề thi thử.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function JLPTPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
