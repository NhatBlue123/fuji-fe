"use client";

import React, { useState } from "react";
import { FlashcardHeader } from "@/components/admin/admin-flashcard/FlashcardHeader";
import { FlashcardTabs } from "@/components/admin/admin-flashcard/FlashcardTabs";
import { FlashcardSetsTable } from "@/components/admin/admin-flashcard/FlashcardSetsTable";
import { FlashcardList } from "@/components/admin/admin-flashcard/FlashcardList";

export default function FlashcardPage() {
    const [activeTab, setActiveTab] = useState("sets");

    return (
        <div className="min-h-screen bg-slate-50/30">
            <div className="p-8 lg:p-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <FlashcardHeader />

                <FlashcardTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
