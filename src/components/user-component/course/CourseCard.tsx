"use client";

import Image from "next/image";
import { Course } from "@/types/course";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const buttonText = course.isEnrolled
    ? course.progress > 0
      ? "Tiếp tục học"
      : "Bắt đầu học"
    : "Đăng ký";

  return (
    <div className="bg-card dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-lg border border-border dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-blue-500/30 transition-all hover:translate-y-[-4px] flex flex-col h-full group">
      <div className="h-44 bg-slate-800 relative overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg">
          {course.levelLabel}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
          {course.description}
        </p>
        <div className="mt-auto">
          {course.isEnrolled && (
            <>
              <div className="flex justify-between text-xs font-medium text-muted-foreground dark:text-slate-400 mb-2">
                <span>Tiến độ</span>
                <span className="text-foreground dark:text-white">
                  {course.progress}%
                </span>
              </div>
              <div className="w-full bg-muted dark:bg-slate-700 rounded-full h-2 mb-5">
                <div
                  className="bg-gradient-to-r from-secondary to-pink-600 h-2 rounded-full shadow-[0_0_10px_#F472B6]"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </>
          )}
          <button className="w-full py-2.5 rounded-lg border border-border dark:border-slate-600 text-foreground dark:text-white font-bold hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all text-sm">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-card dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-lg border border-border dark:border-slate-700/50 animate-pulse">
      <div className="h-44 bg-slate-700"></div>
      <div className="p-5 space-y-4">
        <div className="h-6 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        <div className="space-y-2 mt-6">
          <div className="h-2 bg-slate-700 rounded w-full"></div>
          <div className="h-10 bg-slate-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}
