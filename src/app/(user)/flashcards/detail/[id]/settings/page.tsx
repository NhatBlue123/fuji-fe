"use client";

import { use } from "react";
import FlashcardSettings from "@/components/user-component/flashcard/FlashcardSettings";

export default function FlashcardSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FlashcardSettings id={id} />;
}
