"use client";

import { FEATURED_COURSES } from "@/types/course";
import { CourseCard } from "@/components/user-component/course/CourseCard";

// ✅ Client Component with static data - fast render
export function CoursesSection() {
  return (
    <section className="px-6 md:px-12 lg:px-20 mt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight">
            Khóa học của bạn
          </h2>
          <p className="text-muted-foreground dark:text-slate-400 mt-1">
            Tiếp tục hành trình chinh phục tiếng Nhật nào!
          </p>
        </div>
        <a
          className="hidden md:flex items-center gap-1 text-primary dark:text-blue-400 font-bold hover:text-blue-300 transition-colors"
          href="/course"
        >
          Xem tất cả{" "}
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURED_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}

        {/* AI Call Card */}
        <div className="bg-gradient-to-b from-blue-600 to-indigo-900 dark:from-blue-900 dark:to-[#101828] rounded-2xl overflow-hidden shadow-xl shadow-blue-900/20 border border-blue-500/30 flex flex-col h-full text-white relative group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[120px] leading-none text-blue-400">
              smart_toy
            </span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 blur-[80px] opacity-20"></div>
          <div className="p-6 flex flex-col flex-1 relative z-10">
            <div className="size-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
              <span className="material-symbols-outlined text-secondary text-3xl">
                record_voice_over
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Kaiwa với AI Sensei{" "}
              <span className="align-top text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded ml-1 animate-pulse">
                NEW
              </span>
            </h3>
            <p className="text-sm text-blue-100 mb-6 opacity-80 leading-relaxed">
              Luyện nói tiếng Nhật tự nhiên với trợ lý ảo thông minh 24/7. Phản
              hồi tức thì về phát âm và ngữ điệu.
            </p>
            <div className="mt-auto">
              <button className="w-full py-3 rounded-xl bg-secondary hover:bg-pink-400 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30">
                <span className="material-symbols-outlined text-lg">mic</span>
                Luyện tập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
