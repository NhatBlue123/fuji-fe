import type { Metadata } from "next";

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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gói Premium | FUJI",
    description: "Nâng cấp FUJI Premium — học tiếng Nhật không giới hạn.",
  },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
