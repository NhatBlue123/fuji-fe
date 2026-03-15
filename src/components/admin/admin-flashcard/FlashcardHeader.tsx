"use client";

import React from "react";

export const FlashcardHeader = () => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Flashcard Manager</h1>
                <p className="text-muted-foreground">Quản lý bộ thẻ và thẻ flashcard</p>
            </div>
        </div>
    );
};
