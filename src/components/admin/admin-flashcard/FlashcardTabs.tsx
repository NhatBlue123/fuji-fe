"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, Users } from "lucide-react";

interface FlashcardTabsProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

export const FlashcardTabs = ({
    activeTab,
    onTabChange,
}: FlashcardTabsProps) => {
    return (
        <div className="pb-4 border-b border-border">
            <Tabs
                value={activeTab}
                className="w-fit"
                onValueChange={onTabChange}
            >
                <TabsList>
                    <TabsTrigger value="sets" className="flex items-center gap-2">
                        <Files className="size-4" />
                        Bộ Chứa Thẻ
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="flex items-center gap-2">
                        <Users className="size-4" />
                        Thành Viên Thẻ
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
};
