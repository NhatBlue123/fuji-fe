"use client";

import React, { useState } from "react";
import { FlashcardHeader } from "@/components/admin/admin-flashcard/FlashcardHeader";
import { FlashcardTabs } from "@/components/admin/admin-flashcard/FlashcardTabs";
import { FlashcardSetsTable } from "@/components/admin/admin-flashcard/FlashcardSetsTable";
import { FlashcardList } from "@/components/admin/admin-flashcard/FlashcardList";
import { ImportFlashcardModal } from "@/components/admin/admin-flashcard/ImportFlashcardModal";
import { CreateFlashcardModal } from "@/components/admin/admin-flashcard/CreateFlashcardModal";
import { CreateFlashcardSetModal } from "@/components/admin/admin-flashcard/CreateFlashcardSetModal";
import { Flashcard } from "@/types/flashcard";
import { usePermissions } from "@/hooks/usePermissions";

const INITIAL_CARDS: Flashcard[] = [
  {
    id: 1,
    kanji: "山田",
    hiragana: "やまだ",
    meaning: "Yamada (name)",
    example: "山田さんは日本人です。",
    lesson: "N5 - Unit 1",
    type: "Vocabulary",
    studyStatus: "learned",
    viewCount: 12,
  },
  {
    id: 2,
    kanji: "先生",
    hiragana: "せんせい",
    meaning: "Teacher",
    example: "あの方は先生です。",
    lesson: "N5 - Unit 1",
    type: "Vocabulary",
    studyStatus: "learned",
    viewCount: 8,
  },
  {
    id: 3,
    kanji: "学生",
    hiragana: "がくせい",
    meaning: "Student",
    example: "私は学生です。",
    lesson: "N5 - Unit 1",
    type: "Vocabulary",
    studyStatus: "review",
    viewCount: 21,
  },
  {
    id: 4,
    kanji: "日本語",
    hiragana: "にほんご",
    meaning: "Japanese Language",
    example: "日本語を勉強します。",
    lesson: "N5 - Unit 2",
    type: "Kanji",
    studyStatus: "not_learned",
    viewCount: 0,
  },
];

export default function FlashcardPage() {
  const [activeTab, setActiveTab] = useState("sets");
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("FLASHCARD_CREATE");
  const canEdit = hasPermission("FLASHCARD_EDIT");
  const canDelete = hasPermission("FLASHCARD_DELETE");

  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [isCreateSetModalOpen, setIsCreateSetModalOpen] = useState(false);

  const handleImportSuccess = (newCards: any[]) => {
    const cardsWithIds: Flashcard[] = newCards.map((card, index) => ({
      ...card,
      id: Date.now() + index,
      studyStatus: "not_learned",
    }));
    setCards([...cards, ...cardsWithIds]);
  };

  const handleCreateCard = (newCard: any) => {
    setCards([
      ...cards,
      { ...newCard, id: Date.now(), studyStatus: "not_learned" },
    ]);
  };

  const handleUpdateCard = (updatedCard: Flashcard) => {
    setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (id: number) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <FlashcardHeader />

      <FlashcardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="animate-in fade-in duration-500">
        {activeTab === "sets" ? (
          <FlashcardSetsTable
            onImportClick={
              canCreate ? () => setIsImportModalOpen(true) : undefined
            }
            onCreateClick={
              canCreate ? () => setIsCreateSetModalOpen(true) : undefined
            }
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ) : (
          <FlashcardList
            cards={cards}
            onImportClick={
              canCreate ? () => setIsImportModalOpen(true) : undefined
            }
            onCreateClick={
              canCreate ? () => setIsCreateCardModalOpen(true) : undefined
            }
            onUpdateCard={canEdit ? handleUpdateCard : undefined}
            onDeleteCard={canDelete ? handleDeleteCard : undefined}
          />
        )}
      </div>

      <ImportFlashcardModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportSuccess={handleImportSuccess}
      />

      <CreateFlashcardSetModal
        open={isCreateSetModalOpen}
        onOpenChange={setIsCreateSetModalOpen}
      />

      <CreateFlashcardModal
        open={isCreateCardModalOpen}
        onOpenChange={setIsCreateCardModalOpen}
        onCreateSuccess={handleCreateCard}
      />
    </div>
  );
}
