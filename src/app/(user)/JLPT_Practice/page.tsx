"use client";
import CourseHeader from "./CourseHeader";
import CourseFilters from "./CourseFilter";
import HistoryCard from "./HistoryCard";
import ExamCard from "./ExamCard";
import { useState } from "react";
import { useGetPublishedTestsQuery } from "@/store/services/jlptApi";
import type { JLPTLevel } from "@/types/jlpt";

export default function JlptPracticePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>("N3");
  const pageSize = 9;

  // Fetch published tests from backend
  const { data, isLoading, error } = useGetPublishedTestsQuery({
    level: selectedLevel,
    page: currentPage,
    size: pageSize,
  });

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 1;

  // Default placeholder image for tests without cover
  const defaultImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCDxFdbUtg2jEo2f1rVJJRTWZBFyHB44-mlAfp-GKLrUnc3cvcH-cYZkH9ydP1YZODRfyQc0x6eBpLw_08krUI8ntpUCInksY4rGhIQ81URRQSBldgEks8NzAQfdI8muIWwfH4RaeSIOQCcSC46f2ShFOMCOQekPfNuYnJdTzqcgOFbRdGgflkzcH3f6CnWfeMZ-BeBwcAsHM_QHKpoJWgS8OFizAnRfRkQ-wkuB1LIA4y2pGlwyGgNB5FumbYYiB57B4jKGJC2xEI";

  return (
    <div className="w-full px-6 md:px-12 lg:px-20 py-12 relative bg-[#0B1120] min-h-screen">
      <CourseHeader />
      <CourseFilters />

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-slate-400 py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
          <p className="mt-4">Đang tải đề thi...</p>
        </div>
      )}

      {/* Error state */}
      {!!error && (
        <div className="text-center text-red-400 py-20">
          <span className="material-symbols-outlined text-6xl mb-4">error</span>
          <p className="text-lg font-semibold">Không thể tải danh sách đề thi</p>
          <p className="text-sm text-slate-400 mt-2">Vui lòng thử lại sau</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && tests.length === 0 && (
        <div className="text-center text-slate-400 py-20">
          <span className="material-symbols-outlined text-6xl mb-4">inbox</span>
          <p className="text-lg font-semibold">Chưa có đề thi nào</p>
          <p className="text-sm mt-2">Hệ thống đang cập nhật đề thi mới</p>
        </div>
      )}

      {/* Exam cards grid */}
      {!isLoading && !error && tests.length > 0 && (
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Show history card on first page */}
          {currentPage === 0 && <HistoryCard />}

          {tests.map((test) => (
            <ExamCard
              key={test.id}
              testId={test.id}
              status="new"
              title={test.title}
              image={test.coverImage || defaultImage}
              tag={test.level}
              info={`${test.totalQuestions} câu hỏi • ${test.duration} phút`}
              colorTheme="pink-400"
            />
          ))}
        </section>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2 relative z-10">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="size-10 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i;
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  size-10 rounded-lg flex items-center justify-center font-bold transition-all
                  ${
                    isActive
                      ? "bg-pink-400 text-white shadow-[0_0_10px_rgba(242,181,196,0.3)]"
                      : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                {page + 1}
              </button>
            );
          })}

          {totalPages > 5 && (
            <span className="size-10 flex items-center justify-center text-slate-500">
              ...
            </span>
          )}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
            className="size-10 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}