"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseFiltersProps {
  onTabChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  onTabChange,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs defaultValue="all" onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="PUBLISHED">Đã xuất bản</TabsTrigger>
          <TabsTrigger value="DRAFT">Bản nháp</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm khóa học..."
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
