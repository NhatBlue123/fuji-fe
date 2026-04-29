import type { Metadata } from "next";

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
    type: "website",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
