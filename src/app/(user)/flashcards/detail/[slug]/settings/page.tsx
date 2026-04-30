"use client";

import { use } from "react";
import FlashcardSettings from "@/components/user-component/flashcard/FlashcardSettings";
import { extractTrailingId } from "@/lib/flashcardSeo";

export default function FlashcardSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const id = extractTrailingId(slug);
  return <FlashcardSettings id={id} />;
}
