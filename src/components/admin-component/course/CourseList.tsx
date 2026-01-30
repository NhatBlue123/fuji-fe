"use client";
import { useState } from "react";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  levelColor: string;
  rating: number;
  progress?: number;
  image?: string;
  lessons?: number;
  students?: number;
  isEnrolled: boolean;
}

interface CourseListProps {
  isLoading?: boolean;
}

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Tiếng Nhật N5 Tổng Quát",
    description:
      "Nắm vững bảng chữ cái Hiragana, Katakana và các mẫu câu giao tiếp cơ bản.",
    level: "N5 - Sơ cấp",
    levelColor: "bg-blue-600/90",
    rating: 4.9,
    progress: 35,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE",
    isEnrolled: true,
  },
  {
    id: "2",
    title: "Luyện thi JLPT N4",
    description:
      "Ôn tập ngữ pháp, từ vựng và Kanji cho kỳ thi năng lực tiếng Nhật N4.",
    level: "N4 - Sơ trung cấp",
    levelColor: "bg-emerald-600/90",
    rating: 4.8,
    progress: 12,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04",
    isEnrolled: true,
  },
  {
    id: "3",
    title: "Hán tự N3 - Hack não",
    description:
      "Phương pháp học Kanji qua hình ảnh và câu chuyện cực kỳ dễ nhớ.",
    level: "Kanji",
    levelColor: "bg-purple-600/90",
    rating: 5.0,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c",
    lessons: 24,
    students: 1200,
    isEnrolled: false,
  },
  {
    id: "4",
    title: "Giao tiếp công sở",
    description:
      "Tự tin giao tiếp trong môi trường công ty Nhật Bản. Kính ngữ, khiêm nhường ngữ.",
    level: "Kaiwa",
    levelColor: "bg-orange-600/90",
    rating: 4.7,
    progress: 8,
    isEnrolled: true,
  },
  {
    id: "5",
    title: "Master N2 trong 6 tháng",
    description:
      "Lộ trình cấp tốc dành cho người đi làm. Tập trung vào kỹ năng đọc hiểu và nghe hiểu.",
    level: "N2 - Cao cấp",
    levelColor: "bg-red-600/90",
    rating: 4.9,
    lessons: 45,
    students: 850,
    isEnrolled: false,
  },
  {
    id: "6",
    title: "Bộ đề thi thử JLPT Full",
    description:
      "Kho đề thi thử khổng lồ từ N5 đến N1. Có giải thích chi tiết và chấm điểm tự động.",
    level: "Luyện đề",
    levelColor: "bg-indigo-600/90",
    rating: 5.0,
    lessons: 50,
    students: 2500,
    isEnrolled: false,
  },
];

function CourseCardSkeleton() {
  return (
    <div className="bg-card-bg rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col h-full animate-pulse">
      <div className="h-48 bg-slate-800"></div>
      <div className="p-5 flex flex-col flex-1">
        <div className="h-6 bg-slate-700 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded mb-2 w-full"></div>
        <div className="h-4 bg-slate-700 rounded mb-4 w-5/6"></div>
        <div className="mt-auto mb-5">
          <div className="h-2 bg-slate-700 rounded-full mb-1.5"></div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-slate-700 rounded-lg"></div>
          <div className="flex-1 h-10 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const hasImage = course.image;
  const hasStats = course.lessons || course.students;

  return (
    <div className="bg-card-bg rounded-2xl overflow-hidden border border-slate-700/50 card-hover-effect group flex flex-col h-full">
      <div className="h-48 relative overflow-hidden">
        {hasImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url('${course.image}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-900">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-white/20 group-hover:text-white/40 transition-colors">
                menu_book
              </span>
            </div>
          </div>
        )}
        <div
          className={`absolute top-3 left-3 ${course.levelColor} backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg`}
        >
          {course.level}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-yellow-400 text-xs font-bold border border-white/10">
          <span className="material-symbols-outlined text-sm filled">star</span>{" "}
          {course.rating}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-secondary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {course.progress !== undefined ? (
          <div className="mt-auto mb-5">
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Đã học</span>
              <span className="text-secondary">{course.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-secondary to-pink-600 h-1.5 rounded-full shadow-[0_0_10px_#F472B6]"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        ) : hasStats ? (
          <div className="mt-auto mb-5 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
            {course.lessons && (
              <>
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>{" "}
                {course.lessons} bài học
              </>
            )}
            {course.lessons && course.students && (
              <span className="mx-1">•</span>
            )}
            {course.students && (
              <>
                <span className="material-symbols-outlined text-sm">group</span>{" "}
                {course.students > 1000
                  ? `${(course.students / 1000).toFixed(1)}k`
                  : course.students}{" "}
                học viên
              </>
            )}
          </div>
        ) : (
          <div className="mb-5"></div>
        )}

        <div className="flex gap-3">
          <button className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-colors text-sm">
            Chi tiết
          </button>
          <button className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-pink-400 text-white font-bold transition-all shadow-lg shadow-pink-500/20 text-sm hover:shadow-pink-500/40">
            {course.isEnrolled ? "Học ngay" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseList({ isLoading = false }: CourseListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">
            auto_awesome
          </span>
          Khóa học nổi bật
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`size-8 rounded-full ${
              viewMode === "grid"
                ? "bg-secondary text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            } border border-slate-700 flex items-center justify-center hover:border-slate-500 transition-all`}
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`size-8 rounded-full ${
              viewMode === "list"
                ? "bg-secondary text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            } border border-slate-700 flex items-center justify-center hover:border-slate-500 transition-all`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <CourseCardSkeleton key={idx} />
            ))
          : MOCK_COURSES.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
      </div>

      <div className="mt-12 flex justify-center">
        <nav className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-lg font-bold transition-all ${
                currentPage === page
                  ? "bg-secondary text-white shadow-lg shadow-pink-500/20"
                  : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-slate-500 px-1">...</span>
          <button
            onClick={() => setCurrentPage(8)}
            className={`w-9 h-9 rounded-lg transition-all ${
              currentPage === 8
                ? "bg-secondary text-white shadow-lg shadow-pink-500/20 font-bold"
                : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
            }`}
          >
            8
          </button>
          <button
            disabled={currentPage === 8}
            onClick={() => setCurrentPage((prev) => Math.min(8, prev + 1))}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
