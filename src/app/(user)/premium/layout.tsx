import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 3600;

const DEFAULT_OG_IMAGE = {
  url: "https://fuji.io.vn/images/og_image.png",
  width: 1200,
  height: 630,
  alt: "Gói Premium | FUJI",
  type: "image/png",
};

export const metadata: Metadata = {
  title: "Gói Premium | FUJI",
  description:
    "Nâng cấp tài khoản FUJI Premium để truy cập không giới hạn khóa học, luyện đề JLPT, Video Call 1-1 với giáo viên và AI Chat 24/7.",
  alternates: {
    canonical: "https://fuji.io.vn/premium",
  },
  openGraph: {
    title: "Gói Premium | FUJI",
    description:
      "Nâng cấp FUJI Premium — truy cập không giới hạn khóa học, luyện đề JLPT, Video Call và AI Chat.",
    url: "https://fuji.io.vn/premium",
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gói Premium | FUJI",
    description: "Nâng cấp FUJI Premium — học tiếng Nhật không giới hạn.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
