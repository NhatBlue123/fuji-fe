import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google"; // Import fonts
import "material-symbols/outlined.css"; // Import Material Symbols
import "./globals.css";
import { Providers } from "./providers";
import StoreProvider from "@/store/StoreProvider";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${notoSansJP.variable} antialiased font-display`}
      >
        <Providers>
          {children}
        </Providers>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
