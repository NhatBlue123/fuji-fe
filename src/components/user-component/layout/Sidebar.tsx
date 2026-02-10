"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/common";

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="hidden w-64 flex-col bg-sidebar border-r border-sidebar-border md:flex shadow-xl z-20 transition-colors duration-300">
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-8 hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
      >
        <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden shadow-lg shadow-blue-500/30">
          <span className="material-symbols-outlined text-3xl">landscape</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-sidebar-foreground">
            FUJI
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Học Tiếng Nhật
          </p>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/")
              ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
          }`}
          href="/"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/") ? "filled" : ""
            }`}
          >
            home
          </span>
          <span>Trang chủ</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/course")
              ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
          }`}
          href="/course"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/course")
                ? "filled"
                : "group-hover:text-sidebar-primary transition-colors"
            }`}
          >
            menu_book
          </span>
          <span>Khóa học</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            group
          </span>
          <span>Cộng đồng</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            chat_bubble
          </span>
          <span>Tin nhắn</span>
          <span className="ml-auto bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-secondary/30">
            3
          </span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            smart_toy
          </span>
          <span>Luyện tập AI</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/flashcards")
              ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
          }`}
          href="/flashcards"
        >
          <span
            className={`material-symbols-outlined ${
              isActive("/flashcards")
                ? "filled"
                : "group-hover:text-sidebar-primary transition-colors"
            }`}
          >
            style
          </span>
          <span>Thẻ ghi nhớ</span>
        </Link>
        <div className="my-4 border-t border-sidebar-border mx-4"></div>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            notifications
          </span>
          <span>Thông báo</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            settings
          </span>
          <span>Quản lý</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-4">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-900 dark:to-indigo-950 rounded-xl p-4 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
          <div className="absolute -right-2 -top-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-yellow-300">
              diamond
            </span>
          </div>
          <p className="text-xs font-medium opacity-80 mb-1 text-blue-200">
            Gói cao cấp
          </p>
          <h3 className="font-bold text-sm mb-2">Nâng cấp Premium</h3>
          <button className="bg-white/20 hover:bg-white/30 text-xs font-bold py-1.5 px-3 rounded-lg backdrop-blur-sm transition-colors w-full border border-white/10">
            Xem chi tiết
          </button>
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-muted-foreground">
              contrast
            </span>
            <span className="text-sm font-bold text-sidebar-foreground">
              Sáng / Tối
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              checked={theme === "dark"}
              className="sr-only peer"
              type="checkbox"
              onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
        <div className="flex items-center gap-3 px-2">
          <div
            className="size-10 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white dark:border-gray-600 shadow-sm"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAfFl_pOyFigGwfLtmeb6LniwUCm0yBud_fv-LOAt4SoJGaT1pzBnvbOgHz5kbgBJOB_ssp423Jkd3U7soqab37_QOtQjp5mQW96CfW95qvn9FSRNVuMMNXx7T7vxkuG7ZnHbevTkCEnYHd7eRQX_QSbjeoZteLQeY9ag0vm-wqmhxamd3eiryL-cOTWrKLJp4fETdKaaaZEcH--J8xyVwIDsYlZdYp_zX6qbEXJOIXInVkVVBxP_D4xyoF96BL9Zpu4P_AZlntpRY')",
            }}
          ></div>
          <div>
            <Link
              href="/profile"
              className="flex-1 min-w-0 block rounded-lg
             hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
             transition p-1"
            >
              <p className="text-sm font-bold text-sidebar-foreground truncate">
                Minh Anh
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Học viên N3
              </p>
            </Link>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
