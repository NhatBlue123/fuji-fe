"use client";

import { use, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  useGetFlashCardByIdQuery,
} from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";

export default function FlashcardSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-pink-400 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !flashcard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <p className="text-muted-foreground">Không thể tải bộ flashcard này.</p>
        <Link
          href="/flashcards"
          className="text-secondary hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại
        </Link>
      </div>
    );
  }

  const cards = flashcard.cards || [];
  const cardCount = flashcard.cardCount || cards.length;
  const studyCount = flashcard.studyCount || 0;
  const userProgress = flashcard.userProgress;

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Format next review date
  const formatNextReview = (dateStr: string | null) => {
    if (!dateStr) return "Chưa xác định";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Ngày mai";
    if (diffDays < 0) return "Đã quá hạn";
    if (diffDays < 7) return `${diffDays} ngày`;

    return date.toLocaleDateString("vi-VN");
  };

  // Format study count (e.g., 1200 -> 1.2k)
  const formatStudyCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return count.toString();
  };

  // Get level badge color
  const getLevelBadgeColor = (level: string | null) => {
    switch (level) {
      case "N5":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      case "N4":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "N3":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "N2":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "N1":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // Calculate study time estimate (1 card ~ 20 seconds)
  const studyTimeMinutes = Math.ceil(cardCount * 0.3);

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-[#0B1120]">
      <div className="w-full relative">
        {/* Banner */}
        <section className="relative h-[450px] w-full overflow-hidden group">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear group-hover:scale-110"
            style={{
              backgroundImage: `url('${flashcard.thumbnailUrl || getMockImage(flashcard.id)}')`,
            }}
          ></div>
          <div className="absolute inset-0 bg-linear-to-t from-[#0B1120] via-[#0B1120]/60 to-transparent"></div>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full bg-blue-900/20 mix-blend-overlay"></div>

          {/* Breadcrumb */}
          <div className="absolute top-6 left-6 md:left-10 z-10 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Link
              href="/flashcards"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Quay lại
            </Link>
            <span className="opacity-50">/</span>
            <Link href="/flashcards" className="hover:text-white transition-colors">
              Flashsets
            </Link>
            <span className="opacity-50">/</span>
            <span className="text-white">{flashcard.name}</span>
          </div>

          {/* Banner Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="flex items-center gap-3">
                {flashcard.level && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${getLevelBadgeColor(flashcard.level)}`}>
                    Level {flashcard.level}
                  </span>
                )}
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Sơ cấp
                </span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Từ vựng
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                {flashcard.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-300 font-medium text-sm md:text-base mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-pink-300">
                    style
                  </span>
                  <span>{cardCount} thẻ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-pink-300">
                    schedule
                  </span>
                  <span>{studyTimeMinutes} phút học</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-pink-300">
                    update
                  </span>
                  <span>Cập nhật {formatDate(flashcard.updatedAt)}</span>
                </div>
                {studyCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <img
                        alt="User"
                        className="w-6 h-6 rounded-full border border-white/20"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfFl_pOyFigGwfLtmeb6LniwUCm0yBud_fv-LOAt4SoJGaT1pzBnvbOgHz5kbgBJOB_ssp423Jkd3U7soqab37_QOtQjp5mQW96CfW95qvn9FSRNVuMMNXx7T7vxkuG7ZnHbevTkCEnYHd7eRQX_QSbjeoZteLQeY9ag0vm-wqmhxamd3eiryL-cOTWrKLJp4fETdKaaaZEcH--J8xyVwIDsYlZdYp_zX6qbEXJOIXInVkVVBxP_D4xyoF96BL9Zpu4P_AZlntpRY"
                      />
                      <img
                        alt="User"
                        className="w-6 h-6 rounded-full border border-white/20"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c"
                      />
                      <img
                        alt="User"
                        className="w-6 h-6 rounded-full border border-white/20"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04"
                      />
                    </div>
                    <span>+{formatStudyCount(studyCount)} người học</span>
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Link
                href={`/flashcards/learn/${id}`}
                className="group relative px-8 py-4 bg-secondary hover:bg-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 inline-flex"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined filled animate-pulse-slow">
                    play_circle
                  </span>
                  Bắt đầu học ngay
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="max-w-[1600px] mx-auto w-full p-6 md:p-10 -mt-10 relative z-20 flex flex-col gap-10">
          <div className="glass-panel rounded-2xl p-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 shadow-xl">
            {/* Progress */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="relative size-16 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-700"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  ></path>
                  <path
                    className="text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${userProgress?.progressPercentage || 0}, 100`}
                    strokeWidth="3"
                  ></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {userProgress?.progressPercentage || 0}%
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                  Tiến độ
                </span>
                <span className="text-xl font-bold text-white">
                  {userProgress?.isCompleted
                    ? "Hoàn thành"
                    : userProgress
                    ? "Đang học"
                    : "Chưa bắt đầu"}
                </span>
                <span className="text-xs text-pink-300 mt-1">
                  {userProgress ? "Tiếp tục cố gắng nhé!" : "Hãy bắt đầu ngay!"}
                </span>
              </div>
            </div>

            {/* Remembered */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-linear-to-br from-blue-900/50 to-blue-800/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-400 text-3xl">
                  psychology
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                  Đã nhớ
                </span>
                <span className="text-xl font-bold text-white">
                  {userProgress?.rememberedCount || 0}{" "}
                  <span className="text-sm text-slate-500 font-normal">
                    / {cardCount} thẻ
                  </span>
                </span>
                <span className="text-xs text-blue-300 mt-1">
                  {userProgress && userProgress.rememberedCount > 0
                    ? `+${userProgress.rememberedCount} thẻ hôm nay`
                    : "Chưa có thẻ nào"}
                </span>
              </div>
            </div>

            {/* Next Review */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-linear-to-br from-purple-900/50 to-purple-800/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-purple-400 text-3xl">
                  event_upcoming
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                  Ôn tập tiếp theo
                </span>
                <span className="text-xl font-bold text-white">
                  {userProgress ? formatNextReview(userProgress.nextReviewAt) : "Sẵn sàng"}
                </span>
                <span className="text-xs text-purple-300 mt-1">
                  {userProgress?.nextReviewAt
                    ? `Lúc ${new Date(userProgress.nextReviewAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Bấm để bắt đầu học"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">
                shuffle
              </span>
              Trộn thẻ
            </button>
            <button className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">
                quiz
              </span>
              Chế độ thi thử
            </button>
            <Link
              href={`/flashcards/detail/${id}/settings`}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">
                tune
              </span>
              Cài đặt bộ thẻ
            </Link>
          </div>

          {/* Card list */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-1 h-8 bg-secondary rounded-full"></span>
                Danh sách thẻ
              </h2>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    grid_view
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    view_list
                  </span>
                </button>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4 block">
                  style
                </span>
                <p>Bộ flashcard này chưa có thẻ nào.</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {cards.map((card, index) => {
                  // Use real data from card or fallback
                  const hasPreviewImage = card.exampleSentence && card.exampleSentence.length > 0;

                  return (
                    <article
                      key={card.id}
                      className="group relative bg-[#1E293B] border border-white/5 rounded-2xl p-6 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border uppercase ${
                            hasPreviewImage
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-slate-700/50 text-slate-400 border-slate-600/30"
                          }`}
                        >
                          {hasPreviewImage ? "Đã thuộc" : "Chưa thuộc"}
                        </span>
                        <button className="text-slate-500 hover:text-pink-400 transition-colors">
                          {hasPreviewImage ? (
                            <span className="material-symbols-outlined text-lg">
                              star
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">
                              star_border
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex flex-col items-center justify-center py-4">
                        <h3 className="text-4xl font-black text-white mb-2 group-hover:text-pink-200 transition-colors">
                          {card.vocabulary}
                        </h3>
                        {card.pronunciation && (
                          <p className="text-sm text-slate-400 font-medium">
                            {card.pronunciation}
                          </p>
                        )}
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-3">
                        <div
                          className="size-10 rounded-lg bg-slate-800 bg-cover bg-center shrink-0 border border-white/10"
                          style={{
                            backgroundImage: `url('${card.previewUrl || getMockImage(card.id)}')`,
                          }}
                        ></div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {card.meaning}
                          </p>
                          {card.exampleSentence && (
                            <p className="text-xs text-slate-500 truncate">
                              {card.exampleSentence}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}


          </div>
        </section>
      </div>

      <div className="h-20"></div>
    </div>
  );
}
