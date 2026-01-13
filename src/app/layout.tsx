import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FUJI - Japanese Learning Platform",
  description: "Learn Japanese with FUJI",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Header with FUJI branding */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                FUJI
              </div>
              <span className="text-sm text-muted-foreground">
                Japanese Learning Platform
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Courses
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>
            </nav>
          </div>
        </header>

        {/* Main content area */}
        <main className="pt-16 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-2xl font-bold text-primary">
                FUJI
              </div>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © 2025 FUJI. All rights reserved. Made with ❤️ for Japanese learners.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}