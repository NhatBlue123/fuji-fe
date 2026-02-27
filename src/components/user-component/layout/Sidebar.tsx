"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/common";
import { useAuth, useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";
import Image from "next/image";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success("Đăng xuất thành công!");
      router.push("/");
    } catch {
      toast.error("Đăng xuất thất bại");
    }
  };

  const isActive = (path: string) => pathname === path;

  // ===== STYLE DÙNG CHUNG =====
  const navClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-primary hover:font-bold group"
    }`;

  const iconClass = (path: string) =>
    `material-symbols-outlined ${
      isActive(path) ? "filled" : "group-hover:filled"
    }`;

  return (
    <aside className="hidden w-64 flex-col bg-sidebar border-r border-sidebar-border md:flex shadow-xl z-20">

      {/* ===== LOGO ===== */}
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-8 hover:bg-sidebar-accent/50 transition-colors"
      >
        <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
          <span className="material-symbols-outlined text-3xl">
            landscape
          </span>
        </div>

        <div>
          <h1 className="text-xl font-black text-sidebar-foreground">
            FUJI
          </h1>
          <p className="text-xs text-muted-foreground">Học Tiếng Nhật</p>
        </div>
      </Link>

      {/* ===== MENU ===== */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">

        <Link className={navClass("/")} href="/">
          <span className={iconClass("/")}>home</span>
          Trang chủ
        </Link>

        <Link className={navClass("/course")} href="/course">
          <span className={iconClass("/course")}>menu_book</span>
          Khóa học
        </Link>

        <Link className={navClass("/JLPT_Practice")} href="/JLPT_Practice">
          <span className={iconClass("/JLPT_Practice")}>assignment</span>
          Luyện thi JLPT
        </Link>

        <Link className={navClass("/booking")} href="/booking">
          <span className={iconClass("/booking")}>book_online</span>
          Booking
        </Link>

        <Link className={navClass("/ai-practice")} href="/ai-practice">
          <span className={iconClass("/ai-practice")}>smart_toy</span>
          Luyện tập AI
        </Link>

        <Link className={navClass("/flashcards")} href="/flashcards">
          <span className={iconClass("/flashcards")}>style</span>
          Thẻ ghi nhớ
        </Link>

        <div className="my-4 border-t border-sidebar-border"></div>

        <Link className={navClass("/notifications")} href="/notifications">
          <span className={iconClass("/notifications")}>
            notifications
          </span>
          Thông báo
        </Link>

        <Link className={navClass("/settings")} href="/settings">
          <span className={iconClass("/settings")}>settings</span>
          Quản lý
        </Link>
      </nav>

      {/* ===== FOOTER ===== */}
      <div className="p-4 border-t flex flex-col gap-4">

        {/* PREMIUM */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Gói cao cấp</p>
          <h3 className="font-bold text-sm mb-2">Nâng cấp Premium</h3>

          <button className="bg-white/20 hover:bg-white/30 text-xs font-bold py-1.5 px-3 rounded-lg w-full">
            Xem chi tiết
          </button>
        </div>

        {/* THEME SWITCH */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-bold">Sáng / Tối</span>

          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          />
        </div>

        {/* USER */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-2">

            <Image
              src={
                user.avatar || user.avatarUrl || "/images/avt-default.jpg"
              }
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full"
            />

            <div className="flex-1">
              <Link href="/profile">
                <p className="text-sm font-bold truncate">
                  {user.fullname || user.fullName || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.level ? `Học viên ${user.level}` : user.email}
                </p>
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent"
          >
            <Image
              src="/images/avt-default.jpg"
              alt="login"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-bold">Đăng nhập</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;