"use client";

import { useRouter } from "next/navigation";
import Filter from "./Filter";

type CourseCategoryFilter = "all" | "free" | "paid" | "mine";

interface CourseListClientProps {
  initialLevel?: string;
  initialSearch?: string;
  initialCategory?: string;
}

/**
 * Client Component — renders the interactive Filter controls.
 *
 * Filtering updates the URL so the page can re-render the indexable
 * server-side course list instead of duplicating it with a client-only list.
 */
export default function CourseListClient({
  initialLevel,
  initialSearch,
  initialCategory,
}: CourseListClientProps) {
  const router = useRouter();

  const handleFilterChange = (newFilters: {
    search: string;
    level: string;
    category: CourseCategoryFilter;
  }) => {
    const params = new URLSearchParams();
    const search = newFilters.search.trim();

    if (search) params.set("search", search);
    if (newFilters.level && newFilters.level !== "all") {
      params.set("level", newFilters.level);
    }
    if (newFilters.category && newFilters.category !== "all") {
      params.set("category", newFilters.category);
    }

    const query = params.toString();
    router.push(query ? `/course?${query}` : "/course");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 -mt-16 relative z-30">
      <Filter
        initialSearch={initialSearch}
        initialLevel={initialLevel}
        initialCategory={initialCategory}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
