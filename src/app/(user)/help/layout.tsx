import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Trung tâm hỗ trợ | FUJI",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  title: "Trung tâm hỗ trợ | FUJI",
  description:
    "Tìm câu trả lời cho các câu hỏi thường gặp về FUJI. Hướng dẫn sử dụng, thanh toán, tài khoản và các tính năng học tiếng Nhật.",
  alternates: {
    canonical: "https://fuji.io.vn/help",
  },
  openGraph: {
    title: "Trung tâm hỗ trợ | FUJI",
    description: "Tìm câu trả lời cho các câu hỏi thường gặp về FUJI.",
    url: "https://fuji.io.vn/help",
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trung tâm hỗ trợ | FUJI",
    description: "Tìm câu trả lời cho các câu hỏi thường gặp về FUJI.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
