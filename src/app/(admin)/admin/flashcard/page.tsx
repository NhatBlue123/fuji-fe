"use client";

import React, { useState } from "react";
import { FlashcardHeader } from "@/components/admin/admin-flashcard/FlashcardHeader";
import { FlashcardTabs } from "@/components/admin/admin-flashcard/FlashcardTabs";
import { FlashcardSetsTable } from "@/components/admin/admin-flashcard/FlashcardSetsTable";
import { FlashcardList } from "@/components/admin/admin-flashcard/FlashcardList";

export default function FlashcardPage() {
    const [activeTab, setActiveTab] = useState("sets");

  const handleDeleteCard = (id: number) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <FlashcardHeader />

                <div className="animate-in fade-in duration-500">
                    {activeTab === "sets" ? (
                        <FlashcardSetsTable />
                    ) : (
                        <FlashcardList />
                    )}
                </div>
            </div>
        </div>
    );
}
