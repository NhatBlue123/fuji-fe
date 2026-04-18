"use client";

import { useTranslation } from "react-i18next";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetFlashCardByIdQuery,
  useStartLearningMutation,
} from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";

export default function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);
  const [startLearning] = useStartLearningMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageMode, setImageMode] = useState<
    "front" | "back" | "both" | "none"
  >("front");
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

  // Initialize learning when page loads
  useEffect(() => {
    if (flashcard) {
      startLearning(id).catch(console.error);
    }
  }, [flashcard, id, startLearning]);

  const cards = flashcard?.cards || [];
  const totalCards = cards.length;
  const currentCard = cards[currentIndex];
  const progress =
    totalCards > 0 ? Math.round((completedCards.size / totalCards) * 100) : 0;

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = useCallback(() => {
    // Mark current card as known
    setCompletedCards((prev) => new Set([...prev, currentIndex]));
    // Move to next card
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // All cards completed
      router.push(`/flashcards/detail/${id}`);
    }
  }, [currentIndex, totalCards, router, id]);

  const handleUnknown = useCallback(() => {
    // Just flip back without marking as known
    setIsFlipped(false);
    // Move to next card
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalCards]);

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleNextCard = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, totalCards]);

  const handleShuffle = useCallback(() => {
    // Shuffle cards (simple Fisher-Yates shuffle)
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // This would need to be stored in state - for now just randomize current
    setCurrentIndex(Math.floor(Math.random() * totalCards));
    setIsFlipped(false);
  }, [cards, totalCards]);

  const handleFlipAll = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handlePlayAudio = useCallback(() => {
    if (currentCard?.vocabulary) {
      const utterance = new SpeechSynthesisUtterance(currentCard.vocabulary);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }
  }, [currentCard]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !flashcard || totalCards === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <p className="text-muted-foreground">
          Không thể tải bộ flashcard hoặc không có thẻ nào.
        </p>
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

  // Get image for current card (use previewUrl or fallback to mock)
  const cardImage =
    currentCard?.previewUrl || getMockImage(currentCard?.id || 0);

  // Check if current card is marked as known
  const isCurrentCardKnown = completedCards.has(currentIndex);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background text-foreground">
      <div
        className={`absolute inset-0 ${styles.radialBg} pointer-events-none`}
      ></div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 md:px-10 border-b border-border/40 backdrop-blur-md z-30 bg-background/50">
        <div className="flex items-center gap-4 w-1/4">
          <Link
            href={`/flashcards/detail/${id}`}
            className="flex items-center justify-center size-9 rounded-full bg-card/40 hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all border border-border/40"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Đang học
            </span>
            <h2 className="text-xs md:text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-xs">
              {flashcard.name}
            </h2>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-auto flex flex-col items-center gap-1.5">
          <div className="flex justify-between w-full text-[10px] font-medium text-muted-foreground">
            <span>{completedCards.size} thẻ</span>
            <span>{totalCards} thẻ</span>
          </div>
          <div className="w-full h-1.5 bg-muted/80 rounded-full overflow-hidden border border-border/30 relative">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="w-1/4 flex justify-end items-center gap-1.5">
          <Select
            value={imageMode}
            onValueChange={(value: "front" | "back" | "both" | "none") =>
              setImageMode(value)
            }
          >
            <SelectTrigger className="w-[140px] h-8 text-xs border-border/40 bg-card/40">
              <SelectValue placeholder={t('auto._id__page_6')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">{t('auto._id__page_1')}</SelectItem>
              <SelectItem value="back">{t('auto._id__page_2')}</SelectItem>
              <SelectItem value="both">{t('auto._id__page_3')}</SelectItem>
              <SelectItem value="none">{t('auto._id__page_4')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
            title={t('auto._id__page_7')}
          >
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipAll}
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
            title={t('auto._id__page_8')}
          >
            <span className="material-symbols-outlined text-xl">flip</span>
          </Button>

          {/* Exercise Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
                title={t('auto._id__page_9')}
              >
                <span className="material-symbols-outlined text-xl">quiz</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('auto._id__page_5')}</DialogTitle>
                <DialogDescription>
                  Lựa chọn bài tập phù hợp để ôn luyện từ vựng
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Link
                  href={`/flashcards/exercise/${id}/multiple-choice`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      checklist
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Trắc nghiệm
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chọn đáp án đúng từ 4 lựa chọn
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  href={`/flashcards/exercise/${id}/fill-blank`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-secondary/40 transition-all group cursor-pointer"
                >
                  <div className="size-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-2xl">
                      edit_note
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-secondary transition-colors">
                      Điền từ
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Gõ từ vựng chính xác vào ô trống
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-hover:text-secondary transition-colors">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
          >
            <span className="material-symbols-outlined text-xl">help</span>
          </Button>
        </div>
      </header>

      {/* Card Area */}
      <div
        className={`flex-1 flex flex-col items-center justify-center relative ${styles.perspectiveContainer} px-6 py-4`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,520px)] h-[min(90vw,520px)] bg-primary/[0.06] rounded-full blur-[80px] pointer-events-none" />

        <div className="relative w-full max-w-sm h-[420px] group cursor-pointer z-10">
          <div
            className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`}
            onClick={handleCardClick}
          >
            {/* Front Side */}
            <div
              className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden`}
            >
              <div className="flex justify-between items-center p-4 border-b border-border/40">
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    isCurrentCardKnown
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-primary/20 text-primary border-primary/20"
                  }`}
                >
                  {isCurrentCardKnown ? "Đã thuộc" : "Mới học"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">
                    bookmark
                  </span>
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                {(imageMode === "front" || imageMode === "both") &&
                  cardImage && (
                    <div className="relative size-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-border/20 group-hover:scale-105 transition-transform duration-500">
                      <img
                        alt={currentCard?.vocabulary || "Vocabulary"}
                        className="w-full h-full object-cover"
                        src={cardImage}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}
                <div className="text-center">
                  {currentCard?.pronunciation && (
                    <p className="text-xs text-secondary font-medium mb-0.5">
                      {currentCard.pronunciation}
                    </p>
                  )}
                  <h1
                    className={`${imageMode === "none" || imageMode === "back" ? "text-6xl" : "text-5xl"} font-black text-foreground tracking-tight mb-1 drop-shadow-lg`}
                  >
                    {currentCard?.vocabulary || ""}
                  </h1>
                </div>
              </div>

              <div className="p-3 bg-black/20 backdrop-blur-sm border-t border-border/40">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <span className="material-symbols-outlined text-base">
                    touch_app
                  </span>
                  Chạm để lật thẻ
                </div>
              </div>
            </div>

            {/* Back Side */}
            <div
              className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.rotateY180} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden bg-card`}
            >
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                {(imageMode === "back" || imageMode === "both") &&
                  cardImage && (
                    <div className="relative size-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-border/20 mb-2">
                      <img
                        alt={currentCard?.vocabulary || "Vocabulary"}
                        className="w-full h-full object-cover"
                        src={cardImage}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}
                <h2
                  className={`${imageMode === "back" || imageMode === "both" ? "text-xl" : "text-2xl"} font-bold text-foreground mb-1`}
                >
                  {currentCard?.meaning || ""}
                </h2>
                {currentCard?.exampleSentence && (
                  <>
                    <div className="w-full h-px bg-border/40 my-2"></div>
                    <div className="text-left w-full">
                      <p className="text-xs text-muted-foreground mb-1">
                        Ví dụ:
                      </p>
                      <p
                        className={`${imageMode === "back" || imageMode === "both" ? "text-sm" : "text-base"} text-foreground`}
                      >
                        {currentCard.exampleSentence}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevCard}
            disabled={currentIndex === 0}
            className={`size-10 rounded-xl bg-card/50 border-border/40 ${
              currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={t('auto._id__page_10')}
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </Button>
          <div className="px-4 py-2 rounded-xl bg-card/40 border border-border/40 text-foreground font-bold text-sm min-w-[80px] text-center">
            {currentIndex + 1}/{totalCards}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextCard}
            disabled={currentIndex === totalCards - 1}
            className={`size-10 rounded-xl bg-card/50 border-border/40 ${
              currentIndex === totalCards - 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            title={t('auto._id__page_11')}
          >
            <span className="material-symbols-outlined text-xl">
              arrow_forward
            </span>
          </Button>
        </div>
      </div>

      {/* Controls — native buttons avoid default primary (blue) bar from <Button /> */}
      <footer className="w-full z-30 relative border-t border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-3xl mx-auto px-4 py-5 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-4 md:gap-8 items-center">
            <div className="flex justify-center sm:justify-end order-2 sm:order-1">
              <button
                type="button"
                onClick={handleUnknown}
                className={`group flex w-full max-w-[240px] items-center justify-center gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 transition-colors hover:border-rose-500/45 hover:bg-rose-500/12 ${styles.shadowGlowRed}`}
              >
                <span className="material-symbols-outlined shrink-0 text-[22px] leading-none text-rose-400 [font-variation-settings:'FILL'0,'wght'500,'GRAD'0,'opsz'24]">
                  close
                </span>
                <span className="text-left text-[11px] font-bold uppercase leading-tight tracking-wide text-rose-200/90">
                  Chưa thuộc
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 order-1 sm:order-2 pb-1">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="size-14 shrink-0 rounded-2xl border border-border/50 bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted/60 hover:border-border"
                aria-label="Phát âm"
              >
                <span className="material-symbols-outlined text-2xl leading-none">
                  volume_up
                </span>
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Phát âm
              </span>
              <button
                type="button"
                onClick={handleNextCard}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border/60 hover:decoration-foreground transition-colors pt-0.5"
              >
                Bỏ qua thẻ này
              </button>
            </div>

            <div className="flex justify-center sm:justify-start order-3">
              <button
                type="button"
                onClick={handleKnown}
                className={`group flex w-full max-w-[240px] items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/12 ${styles.shadowGlowGreen}`}
              >
                <span className="material-symbols-outlined shrink-0 text-[22px] leading-none text-emerald-400 [font-variation-settings:'FILL'0,'wght'500,'GRAD'0,'opsz'24]">
                  check
                </span>
                <span className="text-left text-[11px] font-bold uppercase leading-tight tracking-wide text-emerald-200/90">
                  Đã thuộc
                </span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
