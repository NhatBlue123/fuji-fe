import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google"; // Import fonts
import "material-symbols/index.css"; // Import Material Symbols
import "./globals.css";
import Sidebar from "@/components/user-component/Sidebar";
import MobieSidebar from "@/components/user-component/Mobie-sidebar";
import Footer from "@/components/user-component/Footer";


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
      <body className={`${inter.variable} ${notoSansJP.variable} antialiased bg-gray-50 dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300`}>
        <div className="flex h-screen w-full">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50 dark:bg-[#0f172a]">
            <MobieSidebar />
            {children}
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}
