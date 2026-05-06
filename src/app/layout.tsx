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
  metadataBase: new URL("https://fuji.io.vn"),
  title: {
    default: "FUJI - Nền tảng học tiếng Nhật All-in-One",
    template: "%s | FUJI",
  },
  description:
    "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên, Flashcard thông minh. Nền tảng học tiếng Nhật toàn diện nhất Việt Nam.",
  keywords: [
    "học tiếng Nhật",
    "JLPT",
    "luyện đề JLPT",
    "học tiếng Nhật online",
    "AI học tiếng Nhật",
    "giáo viên tiếng Nhật",
    "N5",
    "N4",
    "N3",
    "N2",
    "N1",
    "flashcard tiếng Nhật",
    "FUJI",
  ],
  authors: [{ name: "FUJI Team" }],
  creator: "FUJI",
  publisher: "FUJI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: { url: "/favicon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "FUJI - Nền tảng học tiếng Nhật All-in-One",
    description:
      "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên, Flashcard thông minh.",
    url: "https://fuji.io.vn",
    siteName: "FUJI",
    locale: "vi_VN",
    alternateLocale: ["ja_JP", "en_US"],
    type: "website",
    images: [
      {
        url: "/images/og_image.png",
        width: 1200,
        height: 630,
        alt: "FUJI - Nền tảng học tiếng Nhật All-in-One",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FUJI - Nền tảng học tiếng Nhật All-in-One",
    description:
      "Học tiếng Nhật từ N5 đến N1 với FUJI. Luyện đề JLPT, AI Chat 24/7, Video Call 1-1 với giáo viên.",
    images: ["/images/og_image.png"],
    creator: "@fuji_japan",
  },
  alternates: {
    canonical: "https://fuji.io.vn",
    languages: {
      "vi": "https://fuji.io.vn",
      "en": "https://fuji.io.vn",
      "ja": "https://fuji.io.vn",
      "x-default": "https://fuji.io.vn",
    },
  },
  verification: {
    google: "f1H5onmfPp81rf4x5LH08mN94015JW0XE5zlbHGRDLw",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  category: "education",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Keep the root layout static-friendly. Theme/language are finalized on the
  // client by ThemeProvider/I18nProvider; reading cookies here forces every
  // public ISR route into dynamic server usage.
  const lng = "vi";

  const fontVars = {
    "--font-inter":
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "--font-noto-sans-jp":
      '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
  } as React.CSSProperties;

  return (
    <html
      lang={lng}
      suppressHydrationWarning
      className="antialiased font-display"
      style={fontVars}
    >
      <head suppressHydrationWarning>
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.png" sizes="16x16" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="180x180" />

        {/* Theme initialization script - must run before React hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme');var theme=stored;if(!theme||theme==='system'){theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(theme)}catch(e){}})()`,
          }}
        />

        {/* Resource hints */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://i.postimg.cc" />
        <link rel="dns-prefetch" href="https://i.postimg.cc" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta property="telegram:channel" content="@fuji_japan" />
        <meta property="og:see_also" content="https://linkedin.com/company/fuji-japan" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: "FUJI", description: "Nền tảng học tiếng Nhật All-in-One", url: "https://fuji.io.vn", logo: "https://fuji.io.vn/images/og_image.png", image: "https://fuji.io.vn/images/og_image.png", sameAs: ["https://facebook.com/fuji.japan", "https://twitter.com/fuji_japan", "https://linkedin.com/company/fuji-japan", "https://t.me/fuji_japan"], contactPoint: { "@type": "ContactPoint", contactType: "Customer Service", availableLanguage: ["Vietnamese", "Japanese", "English"] }, address: { "@type": "PostalAddress", addressCountry: "VN", addressLocality: "Ho Chi Minh City" } }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "FUJI", url: "https://fuji.io.vn", potentialAction: { "@type": "SearchAction", target: "https://fuji.io.vn/course?search={search_term_string}", "query-input": "required name=search_term_string" } }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: "Khóa học tiếng Nhật JLPT N5-N1", description: "Học tiếng Nhật từ cơ bản đến nâng cao với FUJI", provider: { "@type": "Organization", name: "FUJI", url: "https://fuji.io.vn" }, educationalLevel: "Beginner to Advanced", inLanguage: ["vi", "ja"], availableLanguage: ["Vietnamese", "Japanese", "English"], coursePrerequisites: "Không yêu cầu kiến thức trước", hasCourseInstance: [{ "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT2H" }] }) }} />
      </head>
      <body suppressHydrationWarning>
        <ExtensionCleanup />

        {/* Register service worker */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(function(r){r.update();}).catch(function(){});}`,
          }}
        />

        <I18nProvider initialLng={lng}>
          <RtkProvider>
            <ThemeProvider
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
