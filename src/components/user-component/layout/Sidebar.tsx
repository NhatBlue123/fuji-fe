"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/common";
import { useAuth, useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";
import Image from "next/image";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import TopupModal from "@/components/user-component/premium/TopupModal";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, roles } = useAuth();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isAdminOrTeacher =
    roles && (roles.includes("ADMIN") || roles.includes("TEACHER"));

  const isActive = (path: string) => pathname === path;

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

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success(t("sidebar.logoutSuccess"));
      router.push("/");
    } catch {
      toast.error(t("sidebar.logoutFailed"));
    }
  };

  return (
    <>
    <aside className="hidden w-64 flex-col bg-sidebar border-r border-sidebar-border md:flex shadow-xl z-20">

      {/* ========= LOGO ========= */}
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-8 hover:bg-sidebar-accent/50 transition"
      >
        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-3xl">
            landscape
          </span>
        </div>

        <div>
          <h1 className="text-xl font-black text-sidebar-foreground">
            FUJI
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("sidebar.subtitle")}
          </p>
        </div>
      </Link>

      {/* ========= MENU ========= */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">

        <Link href="/" className={navClass("/")}>
          <span className={iconClass("/")}>home</span>
          {t("common.home")}
        </Link>

        <Link href="/course" className={navClass("/course")}>
          <span className={iconClass("/course")}>menu_book</span>
          {t("common.course")}
        </Link>

        <Link href="/JLPT_Practice" className={navClass("/JLPT_Practice")}>
          <span className={iconClass("/JLPT_Practice")}>assignment</span>
          {t("common.jlptPractice")}
        </Link>

        <Link href="/booking" className={navClass("/booking")}>
          <span className={iconClass("/booking")}>book_online</span>
          {t("common.booking")}
        </Link>

        <Link href="/ai-practice" className={navClass("/ai-practice")}>
          <span className={iconClass("/ai-practice")}>smart_toy</span>
          {t("common.aiPractice")}
        </Link>

        <Link href="/flashcards" className={navClass("/flashcards")}>
          <span className={iconClass("/flashcards")}>style</span>
          {t("common.flashcard")}
        </Link>

        <div className="my-4 border-t border-sidebar-border" />

        <Link href="/notifications" className={navClass("/notifications")}>
          <span className={iconClass("/notifications")}>
            notifications
          </span>
          {t("common.notification")}
        </Link>

        <Link href="/settings" className={navClass("/settings")}>
          <span className={iconClass("/settings")}>settings</span>
          {t("common.management")}
        </Link>

        {isMounted && isAdminOrTeacher && (
          <Link href="/admin" className={navClass("/admin")}>
            <span className={iconClass("/admin")}>
              admin_panel_settings
            </span>
            Admin
          </Link>
        )}
      </nav>

      {/* ========= FOOTER ========= */}
      <div className="p-4 border-t flex flex-col gap-4">

        {/* Premium */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">
            {t("sidebar.premiumTitle")}
          </p>
          <h3 className="font-bold text-sm mb-2">
            {t("sidebar.premiumHeading")}
          </h3>
          <button
          onClick={() => setIsPremiumModalOpen(true)} 
          className="bg-white/20 hover:bg-white/30 text-xs font-bold py-1.5 px-3 rounded-lg w-full">
            {t("sidebar.viewDetails")}
            
          </button>
        </div>

        {/* Theme + Language */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              contrast
            </span>
            {t("common.themeToggle")}
          </button>

          <LanguageSwitcher className="h-8" />
        </div>

        {/* User */}
        {isMounted && isAuthenticated && user ? (
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
                  {user.level
                    ? `${t("sidebar.studentLevel")} ${user.level}`
                    : user.email}
                </p>
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400"
            >
              <span className="material-symbols-outlined">
                logout
              </span>
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
            <span className="font-bold">{t("common.login")}</span>
          </Link>
        )}
      </div>
    </aside>
    <TopupModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
      />
    </>
    );
};

export default Sidebar;