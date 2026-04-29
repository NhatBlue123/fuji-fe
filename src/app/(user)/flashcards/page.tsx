"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateFlashcardModal from "@/components/user-component/flashcard/CreateFlashcardModal";
import styles from "./page.module.css";
import {
  useGetFlashCardsQuery,
  useGetFlashListsQuery,
} from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildFlashcardDetailHref,
  buildFlashListHref,
} from "@/lib/flashcardSeo";

type OwnershipFilter = "all" | "mine" | "community";
const PAGE_LIMIT = 20;

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function PaginationControls({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="rounded-xl"
      >
        Trước
      </Button>
      <div className="min-w-[120px] text-center text-sm font-medium text-muted-foreground">
        Trang {page + 1} / {Math.max(totalPages, 1)}
      </div>
      <Button
        variant="outline"
        onClick={onNext}
        disabled={!hasNext}
        className="rounded-xl"
      >
        Sau
      </Button>
    </div>
  );
}

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "lists">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [cardsPage, setCardsPage] = useState(0);
  const [listsPage, setListsPage] = useState(0);

  const searchParam = searchQuery.trim();
  const levelParam =
    levelFilter === "all" ? undefined : levelFilter.toUpperCase();
  const selectParam =
    ownershipFilter === "mine"
      ? "me"
      : ownershipFilter === "community"
        ? "other"
        : "all";

  // Fetch data from API
  const {
    data: flashCardsData,
    isLoading: isLoadingCards,
    error: cardsError,
  } = useGetFlashCardsQuery({
    page: cardsPage,
    limit: PAGE_LIMIT,
    search: searchParam || undefined,
    level: levelParam,
    select: selectParam,
  });

  const {
    data: flashListsData,
    isLoading: isLoadingLists,
    error: listsError,
  } = useGetFlashListsQuery({
    page: listsPage,
    limit: PAGE_LIMIT,
    search: searchParam || undefined,
    level: levelParam,
    select: selectParam,
  });

  const isLoading = viewMode === "cards" ? isLoadingCards : isLoadingLists;
  const activeError = viewMode === "cards" ? cardsError : listsError;

  const cards = flashCardsData?.flashCards || [];
  const allLists = [
    ...(flashListsData?.myLists || []),
    ...(flashListsData?.publicLists || []),
  ];

  // De-duplicate by id for defensive rendering.
  const seenIds = new Set<number>();
  const lists = allLists.filter((fl) => {
    if (seenIds.has(fl.id)) return false;
    seenIds.add(fl.id);
    return true;
  });

  const cardsPagination = flashCardsData?.pagination;
  const cardsTotal = cardsPagination?.totalElements ?? cards.length;
  const cardsCurrentPage = cardsPagination?.page ?? cardsPage;
  const cardsTotalPages = Math.max(cardsPagination?.totalPages ?? 1, 1);
  const cardsHasPrevious = cardsPagination?.hasPrevious ?? cardsCurrentPage > 0;
  const cardsHasNext =
    cardsPagination?.hasNext ?? cardsCurrentPage + 1 < cardsTotalPages;

  const listsPagination = flashListsData?.pagination;
  const listsTotal = listsPagination?.totalElements ?? lists.length;
  const listsCurrentPage = listsPagination?.page ?? listsPage;
  const listsTotalPages = Math.max(listsPagination?.totalPages ?? 1, 1);
  const listsHasPrevious = listsPagination?.hasPrevious ?? listsCurrentPage > 0;
  const listsHasNext =
    listsPagination?.hasNext ?? listsCurrentPage + 1 < listsTotalPages;

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background dark:bg-[#0f172a]">
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 py-8">
        <section className="relative w-full rounded-3xl overflow-hidden mb-12 bg-[#0B1120] border border-white/5 shadow-2xl group">
          <div className="absolute inset-0 bg-slate-900"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-full w-full pointer-events-none opacity-40">
            <svg
              className="absolute bottom-0 w-full h-auto"
              preserveAspectRatio="none"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#be185d" stopOpacity="1"></stop>
                  <stop
                    offset="100%"
                    stopColor="#4338ca"
                    stopOpacity="1"
                  ></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.1"
              ></path>
              <path
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.2"
              ></path>
            </svg>
          </div>
          <div className="relative z-10 p-6 md:p-12 flex flex-col gap-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm leading-tight">
                  {t("flashcards.page.title")}
                </span>
              </h1>
              <p className="text-blue-100/70 text-lg font-medium max-w-2xl leading-relaxed hidden sm:block">
                {t("flashcards.page.subtitle")}
              </p>
            </div>
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full pt-4 border-t border-white/5">
              <div className="relative w-full xl:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-pink-200/50 group-focus-within:text-pink-400 transition-colors">
                    search
                  </span>
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCardsPage(0);
                    setListsPage(0);
                  }}
                  className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-2xl leading-5 bg-white/5 backdrop-blur-md text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50 focus:bg-white/10 transition-all shadow-lg shadow-black/20"
                  placeholder={t("flashcards.page.searchPlaceholder")}
                  type="search"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Select
                    value={levelFilter}
                    onValueChange={(value) => {
                      setLevelFilter(value);
                      setCardsPage(0);
                      setListsPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-100 py-3.5 pl-5 pr-12 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors focus:ring-pink-500/30 focus:border-pink-500/50">
                      <SelectValue placeholder={t("flashcards.page.level")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("flashcards.page.allLevels")}</SelectItem>
                      <SelectItem value="n5">N5</SelectItem>
                      <SelectItem value="n4">N4</SelectItem>
                      <SelectItem value="n3">N3</SelectItem>
                      <SelectItem value="n2">N2</SelectItem>
                      <SelectItem value="n1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <Select
                    value={ownershipFilter}
                    onValueChange={(v) => {
                      setOwnershipFilter(v as OwnershipFilter);
                      setCardsPage(0);
                      setListsPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-100 py-3.5 pl-5 pr-12 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors focus:ring-pink-500/30 focus:border-pink-500/50">
                      <SelectValue placeholder={t("flashcards.page.owner")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="mine">{t("flashcards.page.mine")}</SelectItem>
                      <SelectItem value="community">{t("flashcards.page.community")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="xl:ml-auto w-full xl:w-auto mt-2 xl:mt-0">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="relative w-full xl:w-auto group overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-center gap-2 bg-[#0B1120]/60 backdrop-blur-xl hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl transition-all duration-300 h-full w-full">
                    <span className="material-symbols-outlined text-pink-400 group-hover:text-pink-200 transition-colors">
                      add_circle
                    </span>
                    <span className="font-bold tracking-wide">{t("common.create")}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
          </div>
        )}

        {/* Error state */}
        {activeError && !isLoading && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">
              error
            </span>
            <p className="text-muted-foreground">
              {t("flashcards.page.fetchError")}
            </p>
          </div>
        )}

        {/* FlashCards grid */}
        {!isLoading && !cardsError && viewMode === "cards" && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-secondary rounded-full"></span>
              {t("flashcards.page.cards")}
              <span className="text-sm font-normal text-muted-foreground">
                ({cardsTotal})
              </span>
            </h2>
            {cards.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-6xl mb-4 block">
                  style
                </span>
                <p>{t("flashcards.page.noCards")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((fc) => (
                  <Link key={fc.id} href={buildFlashcardDetailHref(fc)}>
                    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full">
                      <div className="relative h-48 bg-muted overflow-hidden flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{
                            backgroundImage: `url('${fc.thumbnailUrl || getMockImage(fc.id)}')`,
                          }}
                        ></div>
                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur text-secondary border border-secondary/30 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                          {fc.user?.username || t("flashcards.page.mine")}
                        </div>
                        {fc.level && (
                          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground border border-border text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                            {fc.level}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-secondary transition-colors truncate">
                          {fc.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                          {fc.description || t("flashcards.page.noDesc")}
                        </p>
                        <div className="mt-auto pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground font-medium">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                content_copy
                              </span>
                              <span>{t("flashcards.page.cardSetCount", { count: fc.cardCount })}</span>
                            </div>
                          </div>
                          <div className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 group-hover:shadow-secondary/40">
                            <span className="material-symbols-outlined text-lg">
                              play_arrow
                            </span>
                            {t("flashcards.page.studyNow")}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <PaginationControls
              page={cardsCurrentPage}
              totalPages={cardsTotalPages}
              hasPrevious={cardsHasPrevious}
              hasNext={cardsHasNext}
              onPrevious={() => setCardsPage((prev) => Math.max(prev - 1, 0))}
              onNext={() =>
                setCardsPage((prev) => (cardsHasNext ? prev + 1 : prev))
              }
            />
          </section>
        )}

        {/* FlashLists grid */}
        {!isLoading && !listsError && viewMode === "lists" && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
              {t("flashcards.page.lists")}
              <span className="text-sm font-normal text-muted-foreground">
                ({listsTotal})
              </span>
            </h2>
            {lists.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-6xl mb-4 block">
                  list
                </span>
                <p>{t("flashcards.page.noLists")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lists.map((fl) => (
                  <Link key={fl.id} href={buildFlashListHref(fl)}>
                    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                      <div className="relative h-48 bg-muted overflow-hidden flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{
                            backgroundImage: `url('${fl.thumbnailUrl || getMockImage(fl.id)}')`,
                          }}
                        ></div>
                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur text-primary border border-primary/30 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                          {fl.user?.username || t("flashcards.page.mine")}
                        </div>
                        {fl.level && (
                          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground border border-border text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                            {fl.level}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                          {fl.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                          {fl.description || t("flashcards.page.noDesc")}
                        </p>
                        <div className="mt-auto pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground font-medium">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                style
                              </span>
                              <span>{t("flashcards.page.setCount", { count: fl.flashcards?.length || 0 })}</span>
                            </div>
                            {(fl.averageRating || 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-yellow-500">
                                  star
                                </span>
                                <span>
                                  {(fl.averageRating || 0).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/40">
                            <span className="material-symbols-outlined text-lg">
                              collections
                            </span>
                            {t("flashcards.page.viewCollection")}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <PaginationControls
              page={listsCurrentPage}
              totalPages={listsTotalPages}
              hasPrevious={listsHasPrevious}
              hasNext={listsHasNext}
              onPrevious={() => setListsPage((prev) => Math.max(prev - 1, 0))}
              onNext={() =>
                setListsPage((prev) => (listsHasNext ? prev + 1 : prev))
              }
            />
          </section>
        )}
      </div>

      {/* Side tabs: CARD / SETS */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end pr-0">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-l-2xl border-y border-l border-gray-200 dark:border-gray-700/50 overflow-hidden flex flex-col">
          <button
            onClick={() => setViewMode("cards")}
            className={`${styles.writingVertical} py-4 px-3 transition-colors text-xs font-bold tracking-widest border-b border-gray-200 dark:border-gray-700/50 ${
              viewMode === "cards"
                ? "bg-secondary text-secondary-foreground shadow-inner"
                : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            CARD
          </button>
          <button
            onClick={() => setViewMode("lists")}
            className={`${styles.writingVertical} py-4 px-3 transition-colors text-xs font-bold tracking-widest ${
              viewMode === "lists"
                ? "bg-secondary text-secondary-foreground shadow-inner"
                : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            SETS
          </button>
        </div>
      </div>

      <CreateFlashcardModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
