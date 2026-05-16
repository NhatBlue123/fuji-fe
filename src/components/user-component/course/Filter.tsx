"use client";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  initialSearch?: string;
  initialLevel?: string;
  initialCategory?: string;
  onFilterChange?: (filters: {
    search: string;
    level: string;
    category: CourseCategoryFilter;
  }) => void;
}

export default function Filter({
  initialSearch = "",
  initialLevel = "all",
  initialCategory = "all",
  onFilterChange,
}: FilterProps) {
  const { t } = useTranslation();
  const initialCategoryValue = useMemo<CourseCategoryFilter>(
    () =>
      ["all", "free", "paid", "mine"].includes(initialCategory)
        ? (initialCategory as CourseCategoryFilter)
        : "all",
    [initialCategory],
  );
  const [search, setSearch] = useState(initialSearch);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryFilter>(initialCategoryValue);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSelectedLevel(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    setSelectedCategory(initialCategoryValue);
  }, [initialCategoryValue]);

  const LEVELS = useMemo(() => [
    { id: "all", label: t("course.filter.all") },
    { id: "n5", label: "N5" },
    { id: "n4", label: "N4" },
    { id: "n3", label: "N3" },
    { id: "n2", label: "N2" },
    { id: "n1", label: "N1" },
  ], [t]);

  const CATEGORIES = useMemo(() => [
    { id: "all", label: t("course.filter.all") },
    { id: "free", label: t("course.filter.free") },
    { id: "paid", label: t("course.filter.paid") },
    { id: "mine", label: t("course.filter.mine") },
  ], [t]);

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
          placeholder={t("course.filter.searchPlaceholder")}
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
          {t("common.search") || "Tìm kiếm"}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
            {t("course.filter.levelLabel")}
          </span>
          <div className="min-w-[220px] w-full sm:w-auto">
            <Select value={selectedLevel} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full rounded-2xl border border-border bg-background/80 backdrop-blur-md text-foreground font-bold">
                <SelectValue placeholder={t("course.filter.levelPlaceholder")} />
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
            {t("course.filter.categoryLabel")}
          </span>
          <div className="min-w-[220px] w-full sm:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full rounded-2xl border border-border bg-background/80 backdrop-blur-md text-foreground font-bold">
                <SelectValue placeholder={t("course.filter.categoryPlaceholder")} />
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
