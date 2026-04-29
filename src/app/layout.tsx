import type React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "material-symbols/outlined.css";
import "tldraw/tldraw.css";
import "@/app/globals.css";
import { ThemeProvider, ExtensionCleanup, I18nProvider } from "@/components/common";
import { Toaster } from "@/components/ui/sonner";
import RtkProvider from "./providers";

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
  const fontVars = {
    "--font-inter":
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "--font-noto-sans-jp":
      '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
  } as React.CSSProperties;

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className="antialiased font-display"
      style={fontVars}
    >
      <head suppressHydrationWarning>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ExtensionCleanup />

        <I18nProvider>
          <RtkProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Script
                id="theme-init"
                src="/theme-init.js"
                strategy="beforeInteractive"
              />
              {children}
              <Toaster />
            </ThemeProvider>
          </RtkProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
