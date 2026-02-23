"use client";

import { use } from "react";
import Link from "next/link";
import { useGetFlashListByIdQuery } from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";

export default function FlashListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: flashlist, isLoading, error } = useGetFlashListByIdQuery(id);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !flashlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <p className="text-muted-foreground">Không thể tải bộ sưu tập này.</p>
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

  const flashcards = flashlist.flashcards || [];

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
              backgroundImage: `url('${flashlist.thumbnailUrl || getMockImage(flashlist.id)}')`,
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40"></div>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 mix-blend-overlay"></div>

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
              {flashlist.title}
            </span>
          </div>

          {/* Banner Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="flex items-center gap-3">
                {flashlist.level && (
                  <span className="bg-blue-600/20 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Level {flashlist.level}
                  </span>
                )}
                {flashlist.isPublic && (
                  <span className="bg-accent/40 text-accent-foreground border border-border/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Công khai
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight drop-shadow-lg tracking-tight">
                {flashlist.title}
              </h1>
              {flashlist.description && (
                <p className="text-muted-foreground text-base max-w-2xl">
                  {flashlist.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium text-sm md:text-base mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">
                    collections
                  </span>
                  <span>{flashcards.length} bộ thẻ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">
                    update
                  </span>
                  <span>Cập nhật {formatDate(flashlist.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">
                    person
                  </span>
                  <span>
                    {flashlist.user?.fullName || flashlist.user?.username}
                  </span>
                </div>
                {flashlist.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400">
                      star
                    </span>
                    <span>{flashlist.averageRating.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-[1600px] mx-auto w-full p-6 md:p-10 -mt-10 relative z-20 flex flex-col gap-10">
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl p-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40 shadow-xl">
            {/* Total flashcards stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border-blue-500/20">
                <span className="material-symbols-outlined text-3xl text-blue-400">
                  collections
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Tổng số bộ thẻ
                </span>
                <span className="text-xl font-bold text-foreground">
                  {flashcards.length}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    bộ
                  </span>
                </span>
              </div>
            </div>
            {/* Level stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border-blue-500/20">
                <span className="material-symbols-outlined text-3xl text-blue-400">
                  school
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Cấp độ
                </span>
                <span className="text-xl font-bold text-foreground">
                  {flashlist.level || "Chưa xác định"}
                </span>
              </div>
            </div>
            {/* Created stat */}
            <div className="flex-1 p-6 flex items-center gap-4">
              <div className="size-16 rounded-2xl border flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border-blue-500/20">
                <span className="material-symbols-outlined text-3xl text-blue-400">
                  event_upcoming
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Ngày tạo
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatDate(flashlist.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* FlashCards list */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                Danh sách FlashCards
              </h2>
            </div>

            {flashcards.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-6xl mb-4 block">
                  collections
                </span>
                <p>Bộ sưu tập này chưa có FlashCard nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {flashcards.map((fc) => (
                  <Link key={fc.id} href={`/flashcards/detail/${fc.id}`}>
                    <article className="group relative bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col h-full">
                      <div className="relative h-48 bg-slate-800 overflow-hidden flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{
                            backgroundImage: `url('${fc.thumbnailUrl || getMockImage(fc.id)}')`,
                          }}
                        ></div>
                        {fc.level && (
                          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                            {fc.level}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                          {fc.name}
                        </h3>
                        <div className="mt-auto pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                content_copy
                              </span>
                              <span>{fc.cardCount} cards</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
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
