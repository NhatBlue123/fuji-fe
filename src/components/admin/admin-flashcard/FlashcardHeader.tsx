"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

interface FlashcardHeaderProps {
  onCreateSet?: () => void;
  onImportExcel?: () => void;
  totalSets?: number;
}

export const FlashcardHeader: React.FC<FlashcardHeaderProps> = ({
  onCreateSet,
  onImportExcel,
  totalSets,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Flashcards</h1>
        <p className="text-muted-foreground">
          {totalSets !== undefined
            ? `${totalSets} bộ thẻ — Quản lý thẻ học và tiến độ ôn tập.`
            : "Quản lý nội dung học và theo dõi thẻ học viên."}
        </p>
      </div>
      <div className="flex items-center gap-2">
           {onImportExcel && (
            <Button variant="outline" onClick={onImportExcel} className="gap-2 h-10 px-4 font-medium transition-all">
                <Download className="size-4" />
                Nhập Excel
                </Button>
            )}
            {onCreateSet && (
                <Button onClick={onCreateSet} className="gap-2 h-10 px-4 font-medium transition-all">
                <Plus className="size-4" />
                Thêm bộ thẻ
                </Button>
            )}
      </div>
    </div>
  );
};
