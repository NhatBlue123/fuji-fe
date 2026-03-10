"use client";
import Input from "@/components/common/Input";

interface CourseFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeLevel: string;
  onLevelChange: (val: string) => void;
  activeCategory: string;
  onCategoryChange: (val: string) => void;
}

const LEVELS = [
  { id: "all", label: "Tất cả" },
  { id: "N5", label: "N5" },
  { id: "N4", label: "N4" },
  { id: "N3", label: "N3" },
  { id: "N2", label: "N2" },
  { id: "N1", label: "N1" },
];

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "full_test", label: "Đề full" },
  { id: "vocabulary_grammar", label: "Từ vựng & Ngữ pháp" },
  { id: "reading", label: "Đọc hiểu" },
  { id: "listening", label: "Nghe hiểu" },
];

export default function CourseFilter({
  search,
  onSearchChange,
  activeLevel,
  onLevelChange,
  activeCategory,
  onCategoryChange,
}: CourseFilterProps) {
  const handleSearch = () => {/* search on change via debounce in parent */};

  return (
    <div className="bg-card glass-card p-6 md:p-8 rounded-2xl border border-border shadow-xl backdrop-blur-xl">
      {/* Search bar */}
      <div className="relative mb-6">
        <Input
          icon="search"
          placeholder="Tìm kiếm đề thi JLPT (VD: N3 đề thi thử, N2...)"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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

      {/* Level + Category filters */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Level */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold mr-2 uppercase tracking-wide">
            Trình độ:
          </span>
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => onLevelChange(level.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeLevel === level.id
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 hover:scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border font-medium hover:border-input"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px bg-border" />

        {/* Category / test type */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold mr-2 uppercase tracking-wide">
            Danh mục:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                activeCategory === cat.id
                  ? "bg-secondary text-secondary-foreground font-bold shadow-lg shadow-secondary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border font-medium hover:border-input"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}