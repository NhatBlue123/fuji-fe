"use client";
import Input from "@/components/common/Input";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface CourseFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeLevel: string;
  onLevelChange: (val: string) => void;
  activeCategory: string;
  onCategoryChange: (val: string) => void;
}

const LEVELS = [
  { id: "all", labelKey: "jlpt.filter.all" },
  { id: "N5", label: "N5" },
  { id: "N4", label: "N4" },
  { id: "N3", label: "N3" },
  { id: "N2", label: "N2" },
  { id: "N1", label: "N1" },
];

const CATEGORIES = [
  { id: "all", labelKey: "jlpt.filter.all" },
  { id: "full_test", labelKey: "jlpt.filter.fullTest" },
  { id: "vocabulary_grammar", labelKey: "jlpt.filter.vocabularyGrammar" },
  { id: "reading", labelKey: "jlpt.filter.reading" },
  { id: "listening", labelKey: "jlpt.filter.listening" },
];

export default function CourseFilter({
  search,
  onSearchChange,
  activeLevel,
  onLevelChange,
  activeCategory,
  onCategoryChange,
}: CourseFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card glass-card p-6 md:p-8 rounded-2xl border border-border shadow-xl backdrop-blur-xl">
      <div className="relative mb-6">
        <Input
          icon="search"
          placeholder={t("auto.jlpt_filter_1")}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchChange(search)}
          className="pr-28"
        />
        <Button
          onClick={() => onSearchChange(search)}
          className="absolute inset-y-2 right-2 px-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-lg text-sm transition-colors shadow-lg shadow-secondary/20"
        >
          {t("jlpt.filter.searchButton", { defaultValue: "Tìm kiếm" })}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-wide shrink-0">
            {t("jlpt.filter.levelLabel", { defaultValue: "Trình độ:" })}
          </span>
          <select
            value={activeLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            {LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.labelKey ? t(level.labelKey) : level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-wide shrink-0">
            {t("jlpt.filter.categoryLabel", { defaultValue: "Danh mục:" })}
          </span>
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {t(cat.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
