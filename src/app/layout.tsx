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
      </head>
      <body suppressHydrationWarning>
        <ExtensionCleanup />

        {/* Register service worker for custom offline page */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                  .then(function(reg) { reg.update(); })
                  .catch(function(){});
              }
            `,
          }}
        />

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
