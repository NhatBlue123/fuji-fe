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

    // Modal states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
    const [isCreateSetModalOpen, setIsCreateSetModalOpen] = useState(false);

    const handleImportSuccess = (newCards: any[]) => {
        const cardsWithIds: Flashcard[] = newCards.map((card, index) => ({
            ...card,
            id: Date.now() + index,
            studyStatus: "not_learned"
        }));
        setCards([...cards, ...cardsWithIds]);
    };

    const handleCreateCard = (newCard: any) => {
        setCards([...cards, { ...newCard, id: Date.now(), studyStatus: "not_learned" }]);
    };

    const handleUpdateCard = (updatedCard: Flashcard) => {
        setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c));
    };

    const handleDeleteCard = (id: number) => {
        setCards(cards.filter(c => c.id !== id));
    };

    return (
        <div className="min-h-screen bg-slate-50/30">
            <div className="p-8 lg:p-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <FlashcardHeader />

                <FlashcardTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="animate-in fade-in duration-500">
                    {activeTab === "sets" ? (
                        <FlashcardSetsTable
                            onImportClick={() => setIsImportModalOpen(true)}
                            onCreateClick={() => setIsCreateSetModalOpen(true)}
                        />
                    ) : (
                        <FlashcardList
                            cards={cards}
                            onImportClick={() => setIsImportModalOpen(true)}
                            onCreateClick={() => setIsCreateCardModalOpen(true)}
                            onUpdateCard={handleUpdateCard}
                            onDeleteCard={handleDeleteCard}
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
        </div>
    );
}
