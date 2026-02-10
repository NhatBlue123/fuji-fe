"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseFiltersProps {
    onTabChange: (value: string) => void;
    onSearchChange: (value: string) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({ onTabChange, onSearchChange }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
            <Tabs
                defaultValue="all"
                className="w-fit"
                onValueChange={onTabChange}
            >
                <TabsList className="bg-slate-100/80 p-1 h-12 rounded-xl border border-slate-200/50">
                    <TabsTrigger value="all" className="px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-slate-500 data-[state=active]:text-slate-900 transition-all">
                        Tất cả
                    </TabsTrigger>
                    <TabsTrigger value="PUBLISHED" className="px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-slate-500 data-[state=active]:text-slate-900 transition-all">
                        Đã xuất bản
                    </TabsTrigger>
                    <TabsTrigger value="DRAFT" className="px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-slate-500 data-[state=active]:text-slate-900 transition-all">
                        Bản nháp
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <Input
                    placeholder="Search courses..."
                    className="pl-12 h-12 bg-white border-slate-200 rounded-xl focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 shadow-sm transition-all"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
};
