import type React from "react";
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "material-symbols/outlined.css";
import { ThemeProvider, ExtensionCleanup } from "@/components/common";
import { Toaster } from "@/components/ui/sonner";
import RtkProvider from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FUJI - Học Tiếng Nhật Online",
  description: "Chinh phục tiếng Nhật cùng FUJI",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "FUJI - Học Tiếng Nhật Online",
    description: "Chinh phục tiếng Nhật cùng FUJI",
    url: "https://fuji.vercel.app/",
    siteName: "FUJI",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FUJI - Học Tiếng Nhật Online",
    description: "Chinh phục tiếng Nhật cùng FUJI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJP.variable} antialiased font-display`}
    >
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* Chống flash theme - Script này phải chạy đồng bộ trong <head> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var root = document.documentElement;

    // Xóa các class theme cũ
    root.classList.remove('light', 'dark');

    // Áp dụng theme
    if (theme === 'dark' || theme === 'light') {
      root.classList.add(theme);
    } else {
      // Nếu chưa có theme hoặc theme = 'system', dùng system preference
      var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');
    }
  } catch(e) {
    // Fallback: nếu lỗi thì dùng light mode
    document.documentElement.classList.add('light');
  }
})();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ExtensionCleanup />

        <RtkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </RtkProvider>
      </body>
    </html>
  );
}
