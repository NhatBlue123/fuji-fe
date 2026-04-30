import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Làm bài thi JLPT | FUJI",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function JLPTTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
