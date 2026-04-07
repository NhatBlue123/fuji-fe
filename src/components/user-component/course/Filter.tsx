"use client";
import { useState } from "react";
import Input from "@/components/common/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourseCategoryFilter = "all" | "free" | "paid" | "mine";

interface FilterProps {
  onFilterChange?: (filters: {
    search: string;
    level: string;
    category: CourseCategoryFilter;
  }) => void;
}

const LEVELS = [
  { id: "all", label: "Tất cả" },
  { id: "n5", label: "N5" },
  { id: "n4", label: "N4" },
  { id: "n3", label: "N3" },
  { id: "n2", label: "N2" },
  { id: "n1", label: "N1" },
];

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "free", label: "Miễn phí" },
  { id: "paid", label: "Tốn phí" },
  { id: "mine", label: "Của tôi" },
];

export default function Filter({ onFilterChange }: FilterProps) {
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryFilter>("all");

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    onFilterChange?.({
      search,
      level,
      category: selectedCategory,
    });
  };

  const handleCategoryChange = (category: string) => {
    const nextCategory = category as CourseCategoryFilter;
    setSelectedCategory(nextCategory);
    onFilterChange?.({
      search,
      level: selectedLevel,
      category: nextCategory,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearch = () => {
    onFilterChange?.({
      search,
      level: selectedLevel,
      category: selectedCategory,
    });
  };

  return (
    <div className="bg-card glass-card p-6 md:p-8 rounded-2xl border border-border shadow-xl backdrop-blur-xl">
      <div className="relative mb-6">
        <Input
          icon="search"
          placeholder="Tìm kiếm khóa học (VD: Luyện thi N3, Kaiwa...)"
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pr-28"
        />
        <button
          onClick={handleSearch}
          className="absolute inset-y-2 right-2 px-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-lg text-sm transition-colors shadow-lg shadow-secondary/20"
        >
          Tìm kiếm
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
            Trình độ:
          </span>
          <div className="min-w-[220px] w-full sm:w-auto">
            <Select value={selectedLevel} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full rounded-2xl border border-border bg-background/80 backdrop-blur-md text-foreground font-bold">
                <SelectValue placeholder="Chọn trình độ" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
            Danh mục:
          </span>
          <div className="min-w-[220px] w-full sm:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full rounded-2xl border border-border bg-background/80 backdrop-blur-md text-foreground font-bold">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
