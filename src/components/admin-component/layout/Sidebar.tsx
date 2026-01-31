"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="hidden w-64 flex-col bg-white dark:bg-sidebar-bg border-r border-gray-200 dark:border-gray-800 md:flex shadow-xl z-20 transition-colors duration-300">
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden shadow-lg shadow-blue-500/30">
          <span className="material-symbols-outlined text-3xl">landscape</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            FUJI
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Học Tiếng Nhật
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/home")
              ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-bold shadow-sm dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white font-medium group"
          }`}
          href="/home"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/home") ? "filled" : ""
            }`}
          >
            home
          </span>
          <span>Trang chủ</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/course")
              ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-bold shadow-sm dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white font-medium group"
          }`}
          href="/course"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/course") ? "filled" : ""
            }`}
          >
            school
          </span>
          <span>Khóa học</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/practice")
              ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-bold shadow-sm dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white font-medium group"
          }`}
          href="/practice"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/practice") ? "filled" : ""
            }`}
          >
            exercise
          </span>
          <span>Luyện tập</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/profile")
              ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-bold shadow-sm dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white font-medium group"
          }`}
          href="/profile"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/profile") ? "filled" : ""
            }`}
          >
            person
          </span>
          <span>Hồ sơ</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;