"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardTabsProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

export const FlashcardTabs = ({
    activeTab,
    onTabChange,
}: FlashcardTabsProps) => {
    return (
        <div className="mb-8 pb-6 border-b border-slate-100">
            <Tabs
                value={activeTab}
                className="w-fit"
                onValueChange={onTabChange}
            >
                <TabsList className="bg-slate-100/80 p-1 h-12 rounded-xl border border-slate-200/50">
                    <TabsTrigger
                        value="sets"
                        className={cn(
                            "flex items-center gap-2 px-6 h-10 rounded-lg font-bold transition-all duration-300",
                            "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600",
                            "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Files className={cn("size-4", activeTab === "sets" ? "text-indigo-600" : "text-slate-400")} />
                        Bộ Chứa Thẻ
                    </TabsTrigger>
                    <TabsTrigger
                        value="cards"
                        className={cn(
                            "flex items-center gap-2 px-6 h-10 rounded-lg font-bold transition-all duration-300",
                            "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-amber-600",
                            "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className={cn("size-4", activeTab === "cards" ? "text-amber-600" : "text-slate-400")} />
                        Thành Viên Thẻ
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
};
