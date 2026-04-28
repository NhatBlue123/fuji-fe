"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CourseHeader from "./CourseHeader";
import CourseFilters from "./CourseFilter";
import ExamCard from "./ExamCard";
import { Button } from "@/components/ui/button";
import PaywallPopup from "@/components/common/PaywallPopup";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { getJlptTopupPath } from "@/lib/jlpt-topup";
import {
  useGetMyAttemptsQuery,
  useGetPublishedTestsQuery,
} from "@/store/services/jlptApi";
import type { JLPTLevel, TestAttemptResult } from "@/types/jlpt";

const CATEGORY_LABELS: Record<string, string> = {
  full_test: "De full",
  vocabulary_grammar: "Tu vung va Ngu phap",
  reading: "Doc hieu",
  listening: "Nghe hieu",
};

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCDxFdbUtg2jEo2f1rVJJRTWZBFyHB44-mlAfp-GKLrUnc3cvcH-cYZkH9ydP1YZODRfyQc0x6eBpLw_08krUI8ntpUCInksY4rGhIQ81URRQSBldgEks8NzAQfdI8muIWwfH4RaeSIOQCcSC46f2ShFOMCOQekPfNuYnJdTzqcgOFbRdGgflkzcH3f6CnWfeMZ-BeBwcAsHM_QHKpoJWgS8OFizAnRfRkQ-wkuB1LIA4y2pGlwyGgNB5FumbYYiB57B4jKGJC2xEI";

export default function JlptPracticePage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pageSize = 9;

  const {
    jlptTopupRequired,
    jlptTopupTitle,
    jlptTopupMessage,
    jlptTopupType,
    jlptRecommendedPlan,
  } = useFeatureAccess();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setCurrentPage(0);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(0);
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, error } = useGetPublishedTestsQuery({
    level: selectedLevel === "all" ? undefined : (selectedLevel as JLPTLevel),
    testType: selectedCategory === "all" ? undefined : selectedCategory,
    page: currentPage,
    size: pageSize,
    search: debouncedSearch,
  });

  const { data: attempts } = useGetMyAttemptsQuery();

  const attemptsMap = useMemo(() => {
    if (!attempts) return {};
    const map: Record<number, TestAttemptResult> = {};

    attempts.forEach((attempt) => {
      if (!map[attempt.testId]) {
        map[attempt.testId] = attempt;
      }
    });

    return map;
  }, [attempts]);

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const upgradePath = getJlptTopupPath(jlptTopupType, jlptRecommendedPlan);
  const topupTitle =
    jlptTopupTitle ||
    t("jlpt.topup.title", { defaultValue: "Ban da dung het luot thi JLPT" });
  const topupMessage =
    jlptTopupMessage ||
    t("jlpt.topup.message", {
      defaultValue:
        "Hay nang cap goi hoac mua them de tiep tuc lam bai thi JLPT.",
    });
  const actionLabel = jlptRecommendedPlan
    ? t("paywall.btnUpgrade", { tier: jlptRecommendedPlan })
    : t("premium.viewSuitablePlan", { defaultValue: "Xem goi phu hop" });

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto scroll-smooth bg-background">
      <CourseHeader />

      <div className="relative z-30 mx-auto -mt-16 mb-8 max-w-7xl px-6 md:px-12 lg:px-20">
        <CourseFilters
          search={searchQuery}
          onSearchChange={handleSearchChange}
          activeLevel={selectedLevel}
          onLevelChange={handleLevelChange}
          activeCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16 md:px-12 lg:px-20">
        {jlptTopupRequired && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 p-6 shadow-lg shadow-amber-500/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
                  JLPT topup required
                </p>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {topupTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {topupMessage}
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-500 px-6 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-orange-600"
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="py-20 text-center text-muted-foreground">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-400" />
            <p className="mt-4">{t("auto.jlpt_practice_1")}</p>
          </div>
        )}

        {!!error && (
          <div className="py-20 text-center text-pink-500">
            <span className="material-symbols-outlined mb-4 text-6xl">error</span>
            <p className="text-lg font-semibold">{t("api.error")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("common.tryAgainLater", { defaultValue: "Vui long thu lai sau" })}
            </p>
          </div>
        )}

        {!isLoading && !error && tests.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <span className="material-symbols-outlined mb-4 text-6xl">inbox</span>
            <p className="text-lg font-semibold">{t("auto.jlpt_practice_2")}</p>
            <p className="mt-2 text-sm">{t("auto.jlpt_practice_3")}</p>
          </div>
        )}

        {!isLoading && !error && tests.length > 0 && (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tests.map((test) => {
              const attempt = attemptsMap[test.id];
              let status: "new" | "doing" | "done" | "locked" = attempt
                ? "done"
                : "new";

              if (status === "new" && jlptTopupRequired) {
                status = "locked";
              }

              const categoryLabel =
                CATEGORY_LABELS[test.testType ?? "full_test"] ?? test.testType;

              return (
                <ExamCard
                  key={test.id}
                  testId={test.id}
                  status={status}
                  attemptId={attempt?.id}
                  title={test.title}
                  image={DEFAULT_IMAGE}
                  tag={`${test.level} - ${categoryLabel}`}
                  info={`${test.totalQuestions} cau hoi - ${test.duration} phut`}
                  colorTheme="pink-400"
                  lockedTitle={topupTitle}
                  lockedButtonLabel={actionLabel}
                  onLockedClick={() => setUpgradeOpen(true)}
                />
              );
            })}
          </section>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const page = index;
              const isActive = currentPage === page;

              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex size-10 items-center justify-center rounded-lg font-bold transition-all ${
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30"
                      : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {page + 1}
                </Button>
              );
            })}

            {totalPages > 5 && (
              <span className="flex size-10 items-center justify-center text-muted-foreground">
                ...
              </span>
            )}

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          </div>
        )}
      </div>

      <PaywallPopup
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title={topupTitle}
        description={topupMessage}
        requiredTier={jlptRecommendedPlan === "PREMIUM" ? "PREMIUM" : "PRO"}
        actionLabel={actionLabel}
        upgradePath={upgradePath}
      />
    </div>
  );
}
