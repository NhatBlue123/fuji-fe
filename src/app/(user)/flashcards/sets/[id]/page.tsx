"use client";

import { use } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useGetFlashCardByIdQuery } from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";

export default function FlashcardSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);

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

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background text-foreground">
      <div className="w-full relative">
        {/* Banner */}
        <section className="relative h-[450px] w-full overflow-hidden group bg-card">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear group-hover:scale-110"
            style={{
              backgroundImage: `url('${flashcard.thumbnailUrl || getMockImage(flashcard.id)}')`,
            }}
          ></div>
          <div className={`absolute inset-0 ${styles.bannerGradient}`}></div>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full bg-primary/10 mix-blend-overlay"></div>

          {/* Breadcrumb */}
          <div className="absolute top-6 left-6 md:left-10 z-10 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Link
              href="/flashcards"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Quay lại
            </Link>
            <span className="opacity-60">/</span>
            <Link
              href="/flashcards"
              className="hover:text-white transition-colors"
            >
              Flashcards
            </Link>
            <span className="opacity-60">/</span>
            <span className="text-foreground truncate max-w-[200px]">
              {flashcard.name}
            </span>
          </div>

          {/* Banner Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="flex items-center gap-3">
                {flashcard.level && (
                  <span className="bg-secondary/20 text-secondary-foreground border border-secondary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Level {flashcard.level}
                  </span>
                )}
                {flashcard.isPublic && (
                  <span className="bg-accent/40 text-accent-foreground border border-border/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Công khai
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight drop-shadow-lg tracking-tight">
                {flashcard.name}
              </h1>
              {flashcard.description && (
                <p className="text-muted-foreground text-base max-w-2xl">
                  {flashcard.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium text-sm md:text-base mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    style
                  </span>
                  <span>{cardCount} thẻ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    update
                  </span>
                  <span>Cập nhật {formatDate(flashcard.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    person
                  </span>
                  <span>
                    {flashcard.user?.fullName || flashcard.user?.username}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                href={`/flashcards/learn/${id}`}
                className="group relative px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-2xl shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 inline-flex"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-3 text-lg">
                  <span
                    className={`material-symbols-outlined filled ${styles.pulseSlow}`}
                  >
                    play_circle
                  </span>
                  Bắt đầu học ngay
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-[1600px] mx-auto w-full p-6 md:p-10 -mt-10 relative z-20 flex flex-col gap-10">
          <div
            className={`${styles.glassPanel} rounded-2xl p-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40 shadow-xl`}
          >
            {/* Total cards stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  style
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Tổng số thẻ
                </span>
                <span className="text-xl font-bold text-foreground">
                  {cardCount}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    thẻ
                  </span>
                </span>
              </div>
            </div>
            {/* Level stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                <span className="material-symbols-outlined text-3xl text-primary">
                  school
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Cấp độ
                </span>
                <span className="text-xl font-bold text-foreground">
                  {flashcard.level || "Chưa xác định"}
                </span>
              </div>
            </div>
            {/* Created stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  event_upcoming
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Ngày tạo
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatDate(flashcard.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                shuffle
              </span>
              Trộn thẻ
            </button>
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                quiz
              </span>
              Chế độ thi thử
            </button>
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 ml-auto group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                tune
              </span>
              Cài đặt bộ thẻ
            </button>
          </div>

          {/* Card list */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1 h-8 bg-secondary rounded-full"></span>
                Danh sách thẻ
              </h2>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-6xl mb-4 block">
                  style
                </span>
                <p>Bộ flashcard này chưa có thẻ nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="group relative bg-card border border-border/40 rounded-2xl p-6 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold border uppercase bg-slate-700/50 text-slate-400 border-slate-600/30">
                        #{card.cardOrder}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-4">
                      <h3 className="text-4xl font-black text-foreground mb-2 group-hover:text-secondary transition-colors">
                        {card.vocabulary}
                      </h3>
                      {card.pronunciation && (
                        <p className="text-sm text-muted-foreground font-medium">
                          {card.pronunciation}
                        </p>
                      )}
                    </div>
                    <div className="mt-auto pt-4 border-t border-border/40 flex flex-col gap-1">
                      <p className="text-sm font-bold text-foreground">
                        {card.meaning}
                      </p>
                      {card.exampleSentence && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          {card.exampleSentence}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <div className="h-20"></div>
    </div>
  );
}
