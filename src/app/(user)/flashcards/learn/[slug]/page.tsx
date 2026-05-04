"use client";

import { use, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import FlashcardStudySession from "@/components/user-component/flashcard/FlashcardStudySession";
import {
  useAddWeakCardsMutation,
  useGetFlashCardByIdQuery,
  useMarkWeakCardMasteredMutation,
  useStartLearningMutation,
} from "@/store/services/flashcardApi";
import { useRecordActivityMutation } from "@/store/services/progressApi";
import {
  buildFlashcardDetailHref,
  buildFlashcardExerciseHref,
  extractTrailingId,
} from "@/lib/flashcardSeo";
import { useAuth } from "@/store/hooks";
import type { StudySessionCard } from "@/components/user-component/flashcard/FlashcardStudySession";

export default function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const id = extractTrailingId(slug);
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id, {
    skip: !isAuthenticated,
  });
  const [startLearning] = useStartLearningMutation();
  const [addWeakCards] = useAddWeakCardsMutation();
  const [markMastered] = useMarkWeakCardMasteredMutation();
  const [recordActivity] = useRecordActivityMutation();

  const startedLearningDeckRef = useRef<string | number | null>(null);
  const recordedActivityRef = useRef(false);
  const sessionStartTimeRef = useRef(0);

  const cards = flashcard?.cards || [];
  const totalCards = cards.length;
  const detailHref = flashcard
    ? buildFlashcardDetailHref(flashcard)
    : `/flashcards/detail/${slug}`;

  useEffect(() => {
    recordedActivityRef.current = false;
    sessionStartTimeRef.current = Date.now();
  }, [id]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (flashcard && startedLearningDeckRef.current !== id) {
      startedLearningDeckRef.current = id;
      startLearning(id).catch(console.error);
    }
  }, [flashcard, id, startLearning]);

  const recordFlashcardSession = useCallback(
    async (difficultCardIds: number[]) => {
      if (recordedActivityRef.current || totalCards === 0) return;
      recordedActivityRef.current = true;

      const startedAt = sessionStartTimeRef.current || Date.now();
      const durationMinutes = Math.round((Date.now() - startedAt) / 60000);
      const rememberedCount = Math.max(totalCards - difficultCardIds.length, 0);

      try {
        await recordActivity({
          activityType: "FLASHCARD",
          durationMinutes: Math.max(durationMinutes, 1),
          cardsReviewed: totalCards,
          correctAnswers: rememberedCount,
          totalQuestions: totalCards,
          source: "flashcard",
        }).unwrap();
      } catch (err) {
        console.error("[Flashcard] Failed to record activity:", err);
      }
    },
    [recordActivity, totalCards],
  );

  const handleUnknownCard = useCallback(
    async (card: StudySessionCard) => {
      await addWeakCards({
        flashcardIds: [card.id],
        deckSlug: slug,
        source: "learn-session",
      }).unwrap();
    },
    [addWeakCards, slug],
  );

  const handleKnownCard = useCallback(
    async (card: StudySessionCard) => {
      await markMastered({ flashcardId: card.id }).unwrap();
    },
    [markMastered],
  );

  const handleSessionComplete = useCallback(
    async (difficultCardIds: number[]) => {
      await recordFlashcardSession(difficultCardIds);
    },
    [recordFlashcardSession],
  );

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

  return (
    <FlashcardStudySession
      key={`${id}-${cards.map((card) => card.id).join("-")}`}
      cards={cards}
      title={flashcard.name}
      backHref={detailHref}
      headerEyebrow="Đang học"
      mode="learn"
      exerciseLinks={{
        multipleChoiceHref: buildFlashcardExerciseHref(flashcard, "multiple-choice"),
        fillBlankHref: buildFlashcardExerciseHref(flashcard, "fill-blank"),
      }}
      onKnownCard={handleKnownCard}
      onUnknownCard={handleUnknownCard}
      onSessionComplete={handleSessionComplete}
    />
  );
}
