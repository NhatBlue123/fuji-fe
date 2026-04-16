"use client";
import CourseHeader from "./CourseHeader";
import CourseFilters from "./CourseFilter";
import ExamCard from "./ExamCard";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect } from "react";
import { useGetPublishedTestsQuery, useGetMyAttemptsQuery } from "@/store/services/jlptApi";
import type { JLPTLevel, TestAttemptResult } from "@/types/jlpt";
import { Button } from "@/components/ui/button";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export default function JlptPracticePage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 9;
  const { hasAccess, jlptRemaining, jlptUnlimited } = useFeatureAccess();

  // Use debounce for search query
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedLevel, selectedCategory, debouncedSearch]);

  // Fetch published tests from backend
  const { data, isLoading, error } = useGetPublishedTestsQuery({
    level: selectedLevel === "all" ? undefined : (selectedLevel as JLPTLevel),
    testType: selectedCategory === "all" ? undefined : selectedCategory,
    page: currentPage,
    size: pageSize,
    search: debouncedSearch,
  });

  // Fetch user attempts
  const { data: attempts } = useGetMyAttemptsQuery();

  const attemptsMap = useMemo(() => {
    if (!attempts) return {};
    const map: Record<number, TestAttemptResult> = {};
    attempts.forEach((a) => {
      // Since backend orders by date desc, the first one encountered is the latest
      if (!map[a.testId]) {
        map[a.testId] = a;
      }
    });
    return map;
  }, [attempts]);

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 1;

  // Default placeholder image for tests without cover
  const defaultImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCDxFdbUtg2jEo2f1rVJJRTWZBFyHB44-mlAfp-GKLrUnc3cvcH-cYZkH9ydP1YZODRfyQc0x6eBpLw_08krUI8ntpUCInksY4rGhIQ81URRQSBldgEks8NzAQfdI8muIWwfH4RaeSIOQCcSC46f2ShFOMCOQekPfNuYnJdTzqcgOFbRdGgflkzcH3f6CnWfeMZ-BeBwcAsHM_QHKpoJWgS8OFizAnRfRkQ-wkuB1LIA4y2pGlwyGgNB5FumbYYiB57B4jKGJC2xEI";

  // Human-readable category label for ExamCard tag
  const CATEGORY_LABELS: Record<string, string> = {
    full_test: "Đề full",
    vocabulary_grammar: "Từ vựng & Ngữ pháp",
    reading: "Đọc hiểu",
    listening: "Nghe hiểu",
  };

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background min-h-screen">
      {/* Hero */}
      <CourseHeader />

      {/* Filter card — overlap lên hero, giống trang Khóa học */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 -mt-16 relative z-30 mb-8">
        <CourseFilters
          search={searchQuery}
          onSearchChange={setSearchQuery}
          activeLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          activeCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Nội dung chính */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-16">
        {/* Loading state */}
        {isLoading && (
          <div className="text-center text-muted-foreground py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
            <p className="mt-4">{t('auto.jlpt_practice_1')}</p>
          </div>
        )}

        {/* Error state */}
        {!!error && (
          <div className="text-center text-red-500 py-20">
            <span className="material-symbols-outlined text-6xl mb-4">
              error
            </span>
            <p className="text-lg font-semibold">
              Không thể tải danh sách đề thi
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Vui lòng thử lại sau
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && tests.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <span className="material-symbols-outlined text-6xl mb-4">
              inbox
            </span>
            <p className="text-lg font-semibold">{t('auto.jlpt_practice_2')}</p>
            <p className="text-sm mt-2">{t('auto.jlpt_practice_3')}</p>
          </div>
        )}

        {/* Exam cards grid */}
        {!isLoading && !error && tests.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tests.map((test) => {
              const attempt = attemptsMap[test.id];
              let status: "new" | "doing" | "done" | "locked" = attempt ? "done" : "new";
              
              // Changed from hardcoded PRO check to dynamic quota check
              if (status === "new" && jlptRemaining === 0 && !jlptUnlimited) {
                status = "locked";
              }

              const categoryLabel = CATEGORY_LABELS[test.testType ?? "full_test"] ?? test.testType;
              return (
                <ExamCard
                  key={test.id}
                  testId={test.id}
                  status={status}
                  attemptId={attempt?.id}
                  title={test.title}
                  image={defaultImage}
                  tag={`${test.level} · ${categoryLabel}`}
                  info={`${test.totalQuestions} câu hỏi • ${test.duration} phút`}
                  colorTheme="pink-400"
                />
              );
            })}
          </section>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className="size-10 rounded-lg border border-border text-muted-foreground hover:bg-accent flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = i;
              const isActive = currentPage === pg;
              return (
                <Button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`size-10 rounded-lg flex items-center justify-center font-bold transition-all ${
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30"
                      : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {pg + 1}
                </Button>
              );
            })}

            {totalPages > 5 && (
              <span className="size-10 flex items-center justify-center text-muted-foreground">
                ...
              </span>
            )}

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="size-10 rounded-lg border border-border text-muted-foreground hover:bg-accent flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
