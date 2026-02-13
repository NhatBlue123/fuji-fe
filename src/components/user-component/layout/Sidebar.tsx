"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/common";
import { useAuth } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";
import Image from "next/image";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success("Đăng xuất thành công!");
      router.push("/");
    } catch {
      toast.error("Đăng xuất thất bại");
    }
  };

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
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive("/")
            ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
            }`}
          href="/"
        >
          <span
            className={`material-symbols-outlined ${isActive("/") ? "filled" : ""
              }`}
          >
            home
          </span>
          <span>{t("common.home")}</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive("/course")
            ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
            }`}
          href="/course"
        >
          <span
            className={`material-symbols-outlined ${isActive("/course")
              ? "filled"
              : "group-hover:text-sidebar-primary transition-colors"
              }`}
          >
            menu_book
          </span>
          <span>{t("common.course")}</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="/JLPT_Practice"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            assignment
          </span>
          <span>{t("common.jlptPractice")}</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            book_online
          </span>
          <span>{t("common.booking")}</span>
          {/* <span className="ml-auto bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-secondary/30">
            3
          </span> */}
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            smart_toy
          </span>
          <span>{t("common.aiPractice")}</span>
        </Link>
        <Link
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive("/flashcards")
            ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary font-medium group"
            }`}
          href="/flashcards"
        >
          <span
            className={`material-symbols-outlined ${isActive("/flashcards")
              ? "filled"
              : "group-hover:text-sidebar-primary transition-colors"
              }`}
          >
            style
          </span>
          <span>{t("common.flashcard")}</span>
        </Link>
        <div className="my-4 border-t border-sidebar-border mx-4"></div>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            notifications
          </span>
          <span>{t("common.notification")}</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all font-medium group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            settings
          </span>
          <span>{t("common.management")}</span>
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
        <div className="flex justify-center w-full">
          <div className="flex items-center gap-3">

            {/* Nút Sáng / Tối dạng chip, match với nút English */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-8 w-28 items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-3 text-xs font-medium text-muted-foreground shadow-sm hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"

            >
              <span className="material-symbols-outlined text-[16px] leading-none">
                contrast
              </span>
              <span className="truncate max-w-[80px]">
                {t("common.themeToggle")}
              </span>

            </button>
            {/* Nút đổi ngôn ngữ dạng chip giống style bên trên */}
            <LanguageSwitcher className="h-8" />
          </div>
        </div>
        <div className="flex items-center gap-3 px-2">
          {isMounted && isAuthenticated && user ? (
            <>
              <div className="size-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0">
                <Image
                  src={
                    user.avatar || user.avatarUrl || "/images/avt-default.jpg"
                  }
                  alt={user.fullname || user.fullName || user.username}
                  width={40}
                  height={40}
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/images/avt-default.jpg";
                  }}
                />
              </div>
              <div>
                <Link
                  href="/profile"
                  className="flex-1 min-w-0 block rounded-lg
                   hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                   transition p-1"
                >
                  <p className="text-sm font-bold text-sidebar-foreground truncate">
                    {user.fullname || user.fullName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.level ? `Học viên ${user.level}` : user.email}
                  </p>
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors ml-auto"
                title="Đăng xuất"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors group"
            >
              <div className="size-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0">
                <Image
                  src="/images/avt-default.jpg"
                  alt="Đăng nhập"
                  width={40}
                  height={40}
                  className="size-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-sidebar-foreground group-hover:text-primary truncate">
                  Đăng nhập
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Đăng nhập để bắt đầu
                </p>
              </div>
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary ml-auto">
                login
              </span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
