"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Edit,
  Key,
  LogOut,
  Mail,
  Phone,
  User,
  BookOpen,
  Calendar,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/auth";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Tránh lỗi Hydration khi dùng Dark mode
  useEffect(() => setMounted(true), []);

  const {
    data: user,
    isLoading,
    error,
    isUninitialized,
  } = useGetCurrentUserQuery();

  if (!mounted || isLoading || isUninitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        Đang tải...
      </div>
    );
  }

  if (error || !user) {
    router.push("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
      month: "2-digit",
      year: "numeric",
    });

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-16 transition-colors duration-500">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* ================= HEADER ================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-none transition-all">
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600" />

          <div className="px-8 pb-8 -mt-20">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="avatar"
                      className="object-cover"
                      fill
                    />
                  ) : (
                    getInitials(user.fullName)
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <ActionLink href="/profile/edit" icon={<Edit size={16} />} label="Chỉnh sửa hồ sơ" />
                <ActionLink href="/profile/change-password" icon={<Key size={16} />} label="Đổi mật khẩu" />
                <ActionLink 
                  href="/profile/history-payment" 
                  icon={<History size={16} />} 
                  label="Lịch sử thanh toán" 
                />
                <Button 
                  onClick={() => setOpenLogout(true)}
                  variant="destructive"
                  className="h-11 px-5 rounded-lg flex items-center gap-2"
                >
                  <LogOut size={16} /> Đăng xuất
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {user.fullName}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                <span>@{user.username}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Thành viên từ {formatDate(user.createdAt)}</span>
              </div>
              {user.bio && (
                <p className="text-slate-600 dark:text-slate-300 max-w-2xl mt-4 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <InfoCard icon={<Mail size={18} />} label="Email" value={user.email} />
              <InfoCard icon={<Phone size={18} />} label="Số điện thoại" value={user.phone || "—"} />
              <InfoCard 
                icon={<User size={18} />} 
                label="Giới tính" 
                value={user.gender === "male" ? "Nam" : "Nữ"} 
              />
              <InfoCard 
                icon={<BookOpen size={18} />} 
                label="Trình độ JLPT" 
                value={
                  <span className="px-3 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold border border-indigo-200 dark:border-indigo-800">
                    {user.jlptLevel}
                  </span>
                } 
              />
            </div>
          </div>
        </div>

        {/* ================= ACCOUNT DETAILS ================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <User className="text-indigo-500" size={20} /> Trạng thái tài khoản
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Calendar className="text-slate-400" size={18} />
                  <span className="text-slate-600 dark:text-slate-400">Ngày gia nhập</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(user.createdAt)}</span>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-slate-600 dark:text-slate-400">Trạng thái</span>
                </div>
                <span className={`font-bold ${user.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {user.active ? "Đang hoạt động" : "Bị khóa"}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {openLogout && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 w-full max-w-sm shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Xác nhận đăng xuất</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Bạn có chắc chắn muốn kết thúc phiên làm việc không?
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setOpenLogout(false)}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-300"
              >
                Hủy
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components để code gọn sạch hơn --- */

function ActionLink({ href, icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-5 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-200 dark:border-slate-700"
    >
      {icon} {label}
    </Link>
  );
}

function InfoCard({ icon, label, value }: any) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-transparent transition-all">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-slate-800 dark:text-slate-100 font-semibold truncate">
        {value}
      </div>
    </div>
  );
}