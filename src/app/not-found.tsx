"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Illustration */}
        <div className="flex justify-center mb-12">
          <svg
            className="w-32 h-32 md:w-48 md:h-48 drop-shadow-lg animate-float"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="70" r="35" fill="currentColor" className="text-accent" />
            <circle cx="85" cy="60" r="6" fill="currentColor" className="text-foreground" />
            <circle cx="115" cy="60" r="6" fill="currentColor" className="text-foreground" />
            <circle cx="87" cy="58" r="2" fill="currentColor" className="text-background" />
            <circle cx="117" cy="58" r="2" fill="currentColor" className="text-background" />
            <path
              d="M 100 75 Q 95 80 90 78"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="text-foreground"
            />
            <circle cx="65" cy="70" r="6" fill="currentColor" className="text-pink-400 dark:text-pink-300 opacity-60" />
            <circle cx="135" cy="70" r="6" fill="currentColor" className="text-pink-400 dark:text-pink-300 opacity-60" />
            <rect x="75" y="105" width="50" height="40" rx="8" fill="currentColor" className="text-blue-300 dark:text-blue-500" />
            <rect x="50" y="115" width="20" height="12" rx="6" fill="currentColor" className="text-accent" />
            <rect x="130" y="115" width="20" height="12" rx="6" fill="currentColor" className="text-accent" />
            <rect x="80" y="145" width="12" height="25" rx="6" fill="currentColor" className="text-accent" />
            <rect x="108" y="145" width="12" height="25" rx="6" fill="currentColor" className="text-accent" />
            <ellipse cx="86" cy="172" rx="10" ry="6" fill="currentColor" className="text-red-300 dark:text-red-400" />
            <ellipse cx="114" cy="172" rx="10" ry="6" fill="currentColor" className="text-red-300 dark:text-red-400" />
            <rect x="70" y="95" width="8" height="8" fill="currentColor" className="text-purple-300 dark:text-purple-500" />
            <rect x="122" y="95" width="8" height="8" fill="currentColor" className="text-purple-300 dark:text-purple-500" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-2">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {t("notFound.heading")}
          </h2>

          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            {t("notFound.subtext")}
          </p>

          <p className="text-muted-foreground text-base mb-10 italic">
            {t("notFound.japaneseText")}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg">
                {t("notFound.backToHome")}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                {t("notFound.continueLearning")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
