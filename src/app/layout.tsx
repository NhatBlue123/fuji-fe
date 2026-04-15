import type React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "material-symbols/outlined.css";
import "tldraw/tldraw.css";
import "@/app/globals.css";
import { ThemeProvider, ExtensionCleanup, I18nProvider } from "@/components/common";
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
      <head suppressHydrationWarning>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        {/* Chống flash theme — beforeInteractive inject sớm, tránh raw <script> trong tree (React 19 / Next 16) */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme'),r=document.documentElement;r.classList.remove('light','dark');if(t==='dark'||t==='light'){r.classList.add(t);}else{r.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}['bis_skin_checked','data-new-gr-c-s-check-loaded','data-gr-ext-installed'].forEach(function(a){document.querySelectorAll('['+a+']').forEach(function(el){el.removeAttribute(a);});});}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
        <ExtensionCleanup />

        <I18nProvider>
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
        </I18nProvider>
      </body>

    </html>
  );
}
