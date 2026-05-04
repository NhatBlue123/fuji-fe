"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

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
import { Button } from "@/components/ui/button";
import { getMockImage } from "@/lib/mockImages";
import styles from "@/app/(user)/flashcards/learn/[slug]/page.module.css";

export interface StudySessionCard {
  id: number;
  vocabulary?: string;
  meaning?: string;
  pronunciation?: string;
  previewUrl?: string | null;
  exampleSentence?: string;
  deckSlug?: string;
  struggleCount?: number;
}

interface ExerciseLinks {
  multipleChoiceHref: string;
  fillBlankHref: string;
}

interface FlashcardStudySessionProps {
  cards: StudySessionCard[];
  title: string;
  backHref: string;
  headerEyebrow?: string;
  mode?: "learn" | "personal-review";
  exerciseLinks?: ExerciseLinks;
  onKnownCard?: (card: StudySessionCard) => Promise<void> | void;
  onUnknownCard?: (card: StudySessionCard, difficultyLevel: number) => Promise<void> | void;
  onSessionComplete?: (difficultCardIds: number[]) => Promise<void> | void;
}

export default function FlashcardStudySession({
  cards,
  title,
  backHref,
  headerEyebrow = "Đang học",
  mode = "learn",
  exerciseLinks,
  onKnownCard,
  onUnknownCard,
  onSessionComplete,
}: FlashcardStudySessionProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageMode, setImageMode] = useState<"front" | "back" | "both" | "none">("front");
  const [autoRead, setAutoRead] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [sessionCards, setSessionCards] = useState<StudySessionCard[]>(cards);
  const [requeueCountByCardId, setRequeueCountByCardId] = useState<Record<number, number>>({});
  const [mistakeCountByCardId, setMistakeCountByCardId] = useState<Record<number, number>>({});
  const [difficultCards, setDifficultCards] = useState<Set<number>>(new Set());
  const [targetCardIds, setTargetCardIds] = useState<number[]>(() => cards.map((card) => card.id));
  const [instantReviewEnabled, setInstantReviewEnabled] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    difficultCardIds: number[];
  } | null>(null);

  const completionStartedRef = useRef(false);

  const currentCard = sessionCards[currentIndex];
  const totalCards = targetCardIds.length;
  const progress = totalCards > 0 ? Math.round((completedCards.size / totalCards) * 100) : 0;
  const isCurrentCardKnown = currentCard?.id ? completedCards.has(currentCard.id) : false;
  const futureReviewIds = new Set(
    sessionCards
      .slice(currentIndex + 1)
      .filter((card) => mistakeCountByCardId[card.id] > 0 && !completedCards.has(card.id))
      .map((card) => card.id),
  );
  difficultCards.forEach((cardId) => {
    if (!completedCards.has(cardId)) {
      futureReviewIds.add(cardId);
    }
  });
  const reviewPendingCount = futureReviewIds.size;

  const completeSession = useCallback(
    async (difficultSnapshot: Set<number>) => {
      if (completionStartedRef.current) return;
      completionStartedRef.current = true;
      setIsCompleting(true);
      const difficultCardIds = Array.from(difficultSnapshot);
      try {
        await onSessionComplete?.(difficultCardIds);
      } finally {
        setCompletedSummary({ difficultCardIds });
        setIsCompleting(false);
      }
    },
    [onSessionComplete],
  );

  const advanceOrComplete = useCallback(
    async (nextCards: StudySessionCard[], nextDifficultCards: Set<number>) => {
      if (currentIndex < nextCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        return;
      }
      await completeSession(nextDifficultCards);
    },
    [completeSession, currentIndex],
  );

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev);
  };

  const focusReviewCards = useCallback((cardIds: number[]) => {
    const uniqueIds = Array.from(new Set(cardIds));
    const reviewCards = uniqueIds
      .map((cardId) => cards.find((card) => card.id === cardId))
      .filter((card): card is StudySessionCard => Boolean(card));

    if (reviewCards.length === 0) return;

    completionStartedRef.current = false;
    setCompletedSummary(null);
    setSessionCards(reviewCards);
    setTargetCardIds(reviewCards.map((card) => card.id));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedCards(new Set());
    setRequeueCountByCardId({});
    setDifficultCards(new Set(uniqueIds));
    setIsCompleting(false);
  }, [cards]);

  const handleKnown = useCallback(async () => {
    if (!currentCard?.id || isCompleting) return;

    void Promise.resolve(onKnownCard?.(currentCard)).catch((error) => {
      console.error("[Flashcard] Failed to mark card as known:", error);
    });

    const nextCompletedCards = new Set(completedCards);
    nextCompletedCards.add(currentCard.id);

    const nextDifficultCards = new Set(difficultCards);
    nextDifficultCards.delete(currentCard.id);

    const nextRequeueCountByCardId = { ...requeueCountByCardId };
    delete nextRequeueCountByCardId[currentCard.id];

    const nextMistakeCountByCardId = { ...mistakeCountByCardId };
    delete nextMistakeCountByCardId[currentCard.id];

    const nextCards = sessionCards.filter((card, index) => {
      return index <= currentIndex || card.id !== currentCard.id;
    });

    setCompletedCards(nextCompletedCards);
    setDifficultCards(nextDifficultCards);
    setRequeueCountByCardId(nextRequeueCountByCardId);
    setMistakeCountByCardId(nextMistakeCountByCardId);
    setSessionCards(nextCards);

    await advanceOrComplete(nextCards, nextDifficultCards);
  }, [
    advanceOrComplete,
    completedCards,
    currentCard,
    currentIndex,
    difficultCards,
    isCompleting,
    mistakeCountByCardId,
    onKnownCard,
    requeueCountByCardId,
    sessionCards,
  ]);

  const handleUnknown = useCallback(async () => {
    if (!currentCard?.id || isCompleting) return;

    const currentRequeueCount = requeueCountByCardId[currentCard.id] || 0;
    const difficultyLevel = (mistakeCountByCardId[currentCard.id] || 0) + 1;
    const nextDifficultCards = new Set(difficultCards);
    nextDifficultCards.add(currentCard.id);
    const nextRequeueCountByCardId = { ...requeueCountByCardId };
    const nextMistakeCountByCardId = {
      ...mistakeCountByCardId,
      [currentCard.id]: difficultyLevel,
    };
    let nextCards = sessionCards.filter((card, index) => {
      return index <= currentIndex || card.id !== currentCard.id;
    });

    void Promise.resolve(onUnknownCard?.(currentCard, difficultyLevel)).catch((error) => {
      console.error("[Flashcard] Failed to record weak card:", error);
    });

    if (instantReviewEnabled) {
      const reviewGap = difficultyLevel >= 3 ? 1 : difficultyLevel === 2 ? 2 : 3;
      const insertIndex = Math.min(currentIndex + reviewGap + 1, nextCards.length);
      nextCards = [...nextCards];
      nextCards.splice(insertIndex, 0, currentCard);
      nextRequeueCountByCardId[currentCard.id] = currentRequeueCount + 1;
    }

    setIsFlipped(false);
    setDifficultCards(nextDifficultCards);
    setRequeueCountByCardId(nextRequeueCountByCardId);
    setMistakeCountByCardId(nextMistakeCountByCardId);
    setSessionCards(nextCards);

    await advanceOrComplete(nextCards, nextDifficultCards);
  }, [
    advanceOrComplete,
    currentCard,
    currentIndex,
    difficultCards,
    instantReviewEnabled,
    isCompleting,
    mistakeCountByCardId,
    onUnknownCard,
    requeueCountByCardId,
    sessionCards,
  ]);

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleNextCard = useCallback(() => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, sessionCards.length]);

  const handleShuffle = useCallback(() => {
    if (totalCards === 0) return;
    setCurrentIndex(Math.floor(Math.random() * sessionCards.length));
    setIsFlipped(false);
  }, [sessionCards.length, totalCards]);

  const handleFlipAll = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (currentCard?.vocabulary) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.vocabulary);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }
  }, [currentCard]);

  useEffect(() => {
    if (autoRead && currentCard?.vocabulary) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.vocabulary);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }
  }, [currentIndex, isFlipped, autoRead, currentCard?.vocabulary]);

  const cardImage = currentCard?.previewUrl || getMockImage(currentCard?.id || 0);
  const currentMistakeCount = currentCard?.id ? mistakeCountByCardId[currentCard.id] || 0 : 0;
  const learnBadgeLabel =
    currentMistakeCount >= 3
      ? "Rất khó nhớ"
      : currentMistakeCount === 2
        ? "Khó nhớ"
        : currentMistakeCount === 1
          ? "Cần ôn"
          : isCurrentCardKnown
            ? "Đã thuộc"
            : "Mới học";
  const badgeLabel =
    mode === "personal-review"
      ? currentCard?.deckSlug || "Ôn tập"
      : learnBadgeLabel;

  if (completedSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background px-6 text-center gap-5">
        <div className="size-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-emerald-400">
            task_alt
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hoàn tất phiên học</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {completedSummary.difficultCardIds.length > 0
              ? `${completedSummary.difficultCardIds.length} thẻ vẫn cần ôn lại.`
              : "Không còn thẻ cần ôn lại trong phiên này."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {completedSummary.difficultCardIds.length > 0 && (
            <button
              type="button"
              onClick={() => focusReviewCards(completedSummary.difficultCardIds)}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Ôn lại thẻ chưa thuộc
            </button>
          )}
          <Link
            href={backHref}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  if (!currentCard || totalCards === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-emerald-400">
          celebration
        </span>
        <p className="text-muted-foreground">Không có thẻ cần ôn tập.</p>
        <Link href={backHref} className="text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background text-foreground">
      <div className={`absolute inset-0 ${styles.radialBg} pointer-events-none`}></div>

      <header className="flex items-center justify-between px-6 py-3 md:px-10 border-b border-border/40 backdrop-blur-md z-30 bg-background/50">
        <div className="flex items-center gap-4 w-1/4">
          <Link
            href={backHref}
            className="flex items-center justify-center size-9 rounded-full bg-card/40 hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all border border-border/40"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {headerEyebrow}
            </span>
            <h2 className="text-xs md:text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-xs">
              {title}
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
            onValueChange={(value: "front" | "back" | "both" | "none") => setImageMode(value)}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs border-border/40 bg-card/40">
              <SelectValue placeholder={t("flashcard.learn.imageMode", { defaultValue: "Chế độ hiển thị" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">{t("flashcard.learn.imageFront", { defaultValue: "Hình ảnh mặt trước" })}</SelectItem>
              <SelectItem value="back">{t("flashcard.learn.imageBack", { defaultValue: "Hình ảnh mặt sau" })}</SelectItem>
              <SelectItem value="both">{t("flashcard.learn.imageBoth", { defaultValue: "Cả hai mặt" })}</SelectItem>
              <SelectItem value="none">{t("flashcard.learn.imageNone", { defaultValue: "Không hình ảnh" })}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAutoRead(!autoRead)}
            className={`rounded-full ${autoRead ? "text-secondary bg-secondary/10" : "text-muted-foreground hover:text-foreground hover:bg-card/40"}`}
            title={t("flashcard.learn.autoRead", { defaultValue: "Tự động phát âm" })}
          >
            <span className="material-symbols-outlined text-xl">
              {autoRead ? "volume_up" : "volume_off"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
            title={t("flashcard.learn.shuffle", { defaultValue: "Xáo trộn" })}
          >
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipAll}
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
            title={t("flashcard.learn.flipAll", { defaultValue: "Lật tất cả" })}
          >
            <span className="material-symbols-outlined text-xl">flip</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInstantReviewEnabled((prev) => !prev)}
            className={`rounded-full ${
              instantReviewEnabled
                ? "text-amber-300 bg-amber-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            }`}
            title={instantReviewEnabled ? "Đang bật ôn lại ngay" : "Đang tắt ôn lại ngay"}
          >
            <span className="material-symbols-outlined text-xl">
              {instantReviewEnabled ? "repeat_on" : "repeat"}
            </span>
          </Button>

          {exerciseLinks && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-full"
                  title={t("flashcard.learn.exercise", { defaultValue: "Bài tập" })}
                >
                  <span className="material-symbols-outlined text-xl">quiz</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("flashcard.learn.chooseExercise", { defaultValue: "Chọn bài tập" })}</DialogTitle>
                  <DialogDescription>
                    {t("flashcard.learn.exerciseDesc", { defaultValue: "Lựa chọn bài tập phù hợp để ôn luyện từ vựng" })}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Link
                    href={exerciseLinks.multipleChoiceHref}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-all group cursor-pointer"
                  >
                    <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl">checklist</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        Trắc nghiệm
                      </h3>
                      <p className="text-sm text-muted-foreground">Chọn đáp án đúng từ 4 lựa chọn</p>
                    </div>
                    <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">
                      arrow_forward
                    </span>
                  </Link>

                  <Link
                    href={exerciseLinks.fillBlankHref}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-secondary/40 transition-all group cursor-pointer"
                  >
                    <div className="size-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-2xl">edit_note</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-secondary transition-colors">
                        Điền từ
                      </h3>
                      <p className="text-sm text-muted-foreground">Gõ từ vựng chính xác vào ô trống</p>
                    </div>
                    <span className="material-symbols-outlined text-muted-foreground group-hover:text-secondary transition-colors">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          )}

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

      <div className={`flex-1 flex flex-col items-center justify-center relative ${styles.perspectiveContainer} px-6 py-4`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,520px)] h-[min(90vw,520px)] bg-primary/[0.06] rounded-full blur-[80px] pointer-events-none" />

        <div className="relative w-full max-w-sm h-[420px] group cursor-pointer z-10">
          <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`} onClick={handleCardClick}>
            <div className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden`}>
              <div className="flex justify-between items-center p-4 border-b border-border/40">
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    mode === "personal-review"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : currentMistakeCount >= 3
                        ? "bg-red-500/15 text-red-300 border-red-500/30"
                        : currentMistakeCount === 2
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : currentMistakeCount === 1
                            ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                      : isCurrentCardKnown
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-primary/20 text-primary border-primary/20"
                  }`}
                >
                  {badgeLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">bookmark</span>
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                {(imageMode === "front" || imageMode === "both") && cardImage && (
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
                  <h1
                    className={`${imageMode === "none" || imageMode === "back" ? "text-6xl" : "text-5xl"} font-black text-foreground tracking-tight mb-1 drop-shadow-lg`}
                  >
                    {currentCard?.vocabulary || ""}
                  </h1>
                </div>
              </div>

              <div className="p-3 bg-black/20 backdrop-blur-sm border-t border-border/40">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <span className="material-symbols-outlined text-base">touch_app</span>
                  Chạm để lật thẻ
                </div>
              </div>
            </div>

            <div className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.rotateY180} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden bg-card`}>
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                {(imageMode === "back" || imageMode === "both") && cardImage && (
                  <div className="relative size-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-border/20 mb-2">
                    <img
                      alt={currentCard?.vocabulary || "Vocabulary"}
                      className="w-full h-full object-cover"
                      src={cardImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                )}
                {currentCard?.pronunciation && (
                  <p className="text-sm text-secondary font-medium mb-1">
                    {currentCard.pronunciation}
                  </p>
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
                      <p className="text-xs text-muted-foreground mb-1">Ví dụ:</p>
                      <p className={`${imageMode === "back" || imageMode === "both" ? "text-sm" : "text-base"} text-foreground`}>
                        {currentCard.exampleSentence}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevCard}
            disabled={currentIndex === 0 || isCompleting}
            className={`size-10 rounded-xl bg-card/50 border-border/40 ${
              currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={t("flashcard.learn.prevCard", { defaultValue: "Thẻ trước" })}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Button>
          <div className="flex flex-col items-center">
            <div className="px-4 py-2 rounded-xl bg-card/40 border border-border/40 text-foreground font-bold text-sm min-w-[80px] text-center">
              {Math.min(currentIndex + 1, totalCards)}/{totalCards}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">
              {reviewPendingCount} cần ôn lại
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextCard}
            disabled={currentIndex === sessionCards.length - 1 || isCompleting}
            className={`size-10 rounded-xl bg-card/50 border-border/40 ${
              currentIndex === sessionCards.length - 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={t("flashcard.learn.nextCard", { defaultValue: "Thẻ tiếp theo" })}
          >
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </Button>
        </div>
      </div>

      <footer className="w-full z-30 relative border-t border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-3xl mx-auto px-4 py-5 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-4 md:gap-8 items-center">
            <div className="flex justify-center sm:justify-end order-2 sm:order-1">
              <button
                type="button"
                onClick={handleUnknown}
                disabled={isCompleting}
                className={`group flex w-full max-w-[240px] items-center justify-center gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 transition-colors hover:border-rose-500/45 hover:bg-rose-500/12 disabled:opacity-60 ${styles.shadowGlowRed}`}
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
                <span className="material-symbols-outlined text-2xl leading-none">volume_up</span>
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">Phát âm</span>
              <button
                type="button"
                onClick={handleNextCard}
                disabled={currentIndex === sessionCards.length - 1 || isCompleting}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border/60 hover:decoration-foreground transition-colors pt-0.5 disabled:opacity-50"
              >
                Bỏ qua thẻ này
              </button>
            </div>

            <div className="flex justify-center sm:justify-start order-3">
              <button
                type="button"
                onClick={handleKnown}
                disabled={isCompleting}
                className={`group flex w-full max-w-[240px] items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/12 disabled:opacity-60 ${styles.shadowGlowGreen}`}
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
