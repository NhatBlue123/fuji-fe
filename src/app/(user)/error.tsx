"use client";

import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("User layout error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-4 p-8">
        <span className="material-symbols-outlined text-6xl text-red-500">
          error
        </span>
        <h2 className="text-2xl font-bold text-white">{t("common.errorOccurred")}</h2>
        <p className="text-slate-400 max-w-md">
          {error.message || t("common.tryLater")}
        </p>
        <Button onClick={reset} className="mt-4">
          {t("common.tryAgain")}
        </Button>
      </div>
    </div>
  );
}
