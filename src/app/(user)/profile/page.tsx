"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Key, LogOut, Mail, Phone, User, BookOpen, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth";
//import { useGetMeQuery } from "@/store/services/user/userApi";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
export default function ProfilePage() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading, error, isUninitialized } = useGetCurrentUserQuery();

  // Show loading state while fetching or initializing
  if (isLoading || isUninitialized) {
    return <div className="text-white p-10">Đang tải...</div>;
  }

  // Redirect to login if not authenticated
  if (error || !user) {
    router.push("/login");
    return null;
  }
  // const user = {
  //   username: "luongdc",
  //   email: "luong@gmail.com",
  //   fullname: "Dương Công Lượng",
  //   avatar: "",
  //   bio: "Đam mê học tiếng Nhật 🇯🇵 – Mục tiêu JLPT N3",
  //   gender: "male",
  //   phone: "0123456789",
  //   jlpt_level: "N5",
  //   is_active: true,
  //   created_at: "2025-01-15T00:00:00",
  // };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/");
    router.refresh();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });

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
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ================= HEADER ================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600" />

          <div className="px-8 pb-8 -mt-16">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-indigo-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                {user.avatarUrl? (
                  <Image src={user.avatarUrl} alt="avatar" width={128} height={128} />
                ) : (
                  getInitials(user.fullName)
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-2 px-5 h-11 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <Edit size={16} /> Chỉnh sửa hồ sơ
                </Link>

                <Link
                  href="/profile/change-password"
                  className="flex items-center gap-2 px-5 h-11 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <Key size={16} /> Đổi mật khẩu
                </Link>

                <button
                  onClick={() => setOpenLogout(true)}
                  className="flex items-center gap-2 px-5 h-11 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 space-y-2">
              <h1 className="text-3xl font-bold text-slate-100">{user.fullName}</h1>
              <p className="text-slate-400">@{user.username}</p>
              {user.bio && <p className="text-slate-300 max-w-2xl">{user.bio}</p>}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
              <Info icon={<Mail size={16} />} label="Email" value={user.email} />
              <Info icon={<Phone size={16} />} label="SĐT" value={user.phone || "—"} />
              <Info
                icon={<User size={16} />}
                label="Giới tính"
                value={user.gender === "male" ? "Nam" : "Nữ"}
              />
              <Info
                icon={<BookOpen size={16} />}
                label="JLPT"
                value={
                  <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400">
                    {user.jlptLevel}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* ================= ACCOUNT ================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-100">Thông tin tài khoản</h2>

          <Info icon={<Calendar size={16} />} label="Ngày tham gia" value={formatDate(user.createdAt)} />
          <Info
            icon={<User size={16} />}
            label="Trạng thái"
            value={
              user.active ? (
                <span className="text-emerald-400">Đang hoạt động</span>
              ) : (
                <span className="text-red-400">Bị khóa</span>
              )
            }
          />
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {openLogout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 w-full max-w-sm">
            <p className="text-center text-slate-200">Bạn có chắc muốn đăng xuất?</p>
            <div className="flex gap-3">
              <button onClick={() => setOpenLogout(false)} className="flex-1 py-2 bg-slate-800 rounded-lg">
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 bg-red-600 rounded-lg text-white"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENT ================= */
function Info({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-slate-200 font-medium">{value}</div>
      </div>
    </div>
  );
}
