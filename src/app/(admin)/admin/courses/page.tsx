"use client";

import React, { useState, useMemo } from "react";
import { CourseHeader } from "@/components/admin/admin-components/CourseHeader";
import { CourseFilters } from "@/components/admin/admin-components/CourseFilters";
import { CourseCard } from "@/components/admin/admin-components/CourseCard";

const COURSES_DATA = [
  {
    id: 1,
    title: "JLPT N5 Comprehensive",
    description: "Complete beginner guide to Japanese grammar, vocabulary and Kanji for N5 level.",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
    level: "N5",
    status: "PUBLISHED" as const,
    students: "1,234",
    duration: "24h 30m",
    levelColor: "bg-orange-600",
  },
  {
    id: 2,
    title: "Kanji Mastery N3",
    description: "Intermediate Kanji characters with focus on radicals and common compounds.",
    image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=800&auto=format&fit=crop",
    level: "N3",
    status: "DRAFT" as const,
    students: "0",
    duration: "--h --m",
    levelColor: "bg-purple-600",
  },
  {
    id: 3,
    title: "Listening Practice N2",
    description: "Advanced listening comprehension for business and daily life scenarios.",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=800&auto=format&fit=crop",
    level: "N2",
    status: "PUBLISHED" as const,
    students: "892",
    duration: "18h 15m",
    levelColor: "bg-blue-600",
  },
  {
    id: 4,
    title: "Business Japanese",
    description: "Learn Keigo and formal business etiquette for professional environments in Japan.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
    level: "BIZ",
    status: "DRAFT" as const,
    students: "0",
    duration: "--h --m",
    levelColor: "bg-indigo-700",
  },
  {
    id: 5,
    title: "Grammar Foundation N4",
    description: "Essential grammar structures to bridge the gap between basic and intermediate Japanese.",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
    level: "N4",
    status: "PUBLISHED" as const,
    students: "542",
    duration: "12h 45m",
    levelColor: "bg-teal-600",
  },
];

export default function CoursesPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter((course) => {
      const matchesFilter = filter === "all" || course.status === filter;
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="p-8 lg:p-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CourseHeader />
        <CourseFilters
          onTabChange={setFilter}
          onSearchChange={setSearchQuery}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400 font-medium">Không tìm thấy khóa học nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
