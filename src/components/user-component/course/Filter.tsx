"use client";
import { useState } from "react";
import Input from "@/components/common/Input";

interface FilterProps {
  onFilterChange?: (filters: {
    search: string;
    level: string;
    category: string;
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
  { id: "kaiwa", label: "Kaiwa" },
  { id: "kanji", label: "Kanji" },
  { id: "jlpt", label: "Luyện thi JLPT" },
];

export default function Filter({ onFilterChange }: FilterProps) {
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    onFilterChange?.({
      search,
      level,
      category: selectedCategory,
    });
  };

  const handleCategoryChange = (category: string) => {
    const newCategory = selectedCategory === category ? "" : category;
    setSelectedCategory(newCategory);
    onFilterChange?.({
      search,
      level: selectedLevel,
      category: newCategory,
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

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold mr-2 uppercase tracking-wide">
            Trình độ:
          </span>
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelChange(level.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                selectedLevel === level.id
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 hover:scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border font-medium hover:border-input"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px bg-border"></div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold mr-2 uppercase tracking-wide">
            Danh mục:
          </span>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === category.id
                  ? "bg-secondary text-secondary-foreground font-bold shadow-lg shadow-secondary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border font-medium hover:border-input"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
