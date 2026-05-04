"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import FlashcardStudySession, {
  type StudySessionCard,
} from "@/components/user-component/flashcard/FlashcardStudySession";
import {
  useAddWeakCardsMutation,
  useGetWeakCardReviewSetQuery,
  useMarkWeakCardMasteredMutation,
} from "@/store/services/flashcardApi";
import { useAuth } from "@/store/hooks";

export default function PersonalReviewPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { data, isLoading, error } = useGetWeakCardReviewSetQuery(undefined, {
    skip: !isInitialized || !isAuthenticated,
  });
  const [markMastered] = useMarkWeakCardMasteredMutation();
  const [addWeakCards] = useAddWeakCardsMutation();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  const cards = (data?.cards || []) as StudySessionCard[];

  const handleKnownCard = useCallback(
    async (card: StudySessionCard) => {
      await markMastered({ flashcardId: card.id }).unwrap();
    },
    [markMastered],
  );

  const handleUnknownCard = useCallback(
    async (card: StudySessionCard) => {
      await addWeakCards({
        flashcardIds: [card.id],
        deckSlug: card.deckSlug || "personal-review",
        source: "personal-review",
      }).unwrap();
    },
    [addWeakCards],
  );

  if (isLoading || !isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <p className="text-muted-foreground">Không thể tải bộ ôn tập cá nhân.</p>
        <Link href="/flashcards" className="text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại Flashcards
        </Link>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4 px-6 text-center">
        <div className="size-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-emerald-400">
            celebration
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Bạn đã thuộc hết rồi!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hiện không có thẻ khó nhớ nào trong bộ ôn tập cá nhân.
          </p>
        </div>
        <Link href="/flashcards" className="text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại Flashcards
        </Link>
      </div>
    );
  }

  return (
    <FlashcardStudySession
      key={cards.map((card) => card.id).join("-")}
      cards={cards}
      title="Ôn tập cá nhân"
      backHref="/flashcards"
      headerEyebrow="Đang ôn"
      mode="personal-review"
      onKnownCard={handleKnownCard}
      onUnknownCard={handleUnknownCard}
    />
  );
}
