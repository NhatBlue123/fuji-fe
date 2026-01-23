"use client";
import { useState } from "react";

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
    <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
      <div className="relative mb-6 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-slate-400 group-focus-within:text-secondary transition-colors">
            search
          </span>
        </div>
        <input
          className="block w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl leading-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition duration-150 ease-in-out glass-input"
          placeholder="Tìm kiếm khóa học (VD: Luyện thi N3, Kaiwa...)"
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="absolute inset-y-2 right-2 px-4 bg-secondary hover:bg-pink-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-pink-500/20"
        >
          Tìm kiếm
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 text-sm font-bold mr-2 uppercase tracking-wide">
            Trình độ:
          </span>
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelChange(level.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                selectedLevel === level.id
                  ? "bg-secondary text-white shadow-lg shadow-pink-500/30 hover:scale-105"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 font-medium hover:border-slate-500"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px bg-slate-700"></div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 text-sm font-bold mr-2 uppercase tracking-wide">
            Danh mục:
          </span>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === category.id
                  ? "bg-secondary text-white font-bold shadow-lg shadow-pink-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 font-medium hover:border-slate-500"
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
