"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, LogOut, Key } from "lucide-react";
import { logout } from "@/lib/auth";

export default function ProfilePage() {
  const [openLogout, setOpenLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // ✅ GOOD: Use server action with httpOnly cookies
      await logout();

      // Clear any client-side cache if needed
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* ================= HEADER ================= */}
        <div className="flex flex-row md:flex-row items-center gap-8 rounded-2xl bg-slate-900 p-8 border border-slate-800">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-4xl font-bold text-white">
            L
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-slate-100">
              Dương Công Lượng
            </h1>
            <p className="text-slate-400">Người học tiếng Nhật • Trình độ N5</p>
            <p className="text-slate-400">
              Mục tiêu:{" "}
              <span className="text-slate-200 font-medium">JLPT N3</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Edit Profile */}
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 h-11 px-4 rounded-lg
               bg-slate-700 text-slate-200
               hover:bg-indigo-600 hover:text-white
               transition"
            >
              <Edit size={16} />
              Chỉnh sửa hồ sơ
            </Link>

            {/* Change Password */}
            <Link
              href="/profile/change-password"
              className="flex items-center gap-2 h-11 px-4 rounded-lg
               bg-slate-700 text-slate-200
               hover:bg-indigo-600 hover:text-white
               transition"
            >
              <Key size={16} />
              Đổi mật khẩu
            </Link>

            {/* Logout */}
            <button
              onClick={() => setOpenLogout(true)}
              className="flex items-center gap-2 h-11 px-4 rounded-lg
               bg-slate-700 text-slate-200
               hover:bg-indigo-600 hover:text-white
               transition"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>

        {openLogout && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center
                        bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-5">
              <h2 className="text-lg font-semibold text-center">
                Xác nhận đăng xuất
              </h2>

              <p className="text-sm text-zinc-400 text-center">
                Bạn có chắc chắn muốn đăng xuất không?
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setOpenLogout(false)}
                  className="flex-1 py-2 rounded-lg bg-zinc-700
                           hover:bg-zinc-600 transition"
                >
                  Hủy
                </button>

                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-lg bg-red-600
                           hover:bg-red-500 transition"
                >
                  Có
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATS ================= */}
        <div className="flex grid-cols-1 sm:grid-cols-3 p-4 gap-6">
          {[
            { label: "Trình độ", value: "N5" },
            { label: "Từ vựng đã học", value: "1,240" },
            { label: "Chuỗi ngày học", value: "18 🔥" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-900 border border-slate-800 p-6"
            >
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* ================= PROGRESS ================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-6">
          <h2 className="text-xl font-semibold text-slate-100">
            Tiến độ học tập
          </h2>

          {[
            { label: "Từ vựng", percent: 70 },
            { label: "Ngữ pháp", percent: 55 },
            { label: "Nghe hiểu", percent: 40 },
            { label: "Đọc hiểu", percent: 35 },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm text-slate-400">
                <span>{item.label}</span>
                <span>{item.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ================= GOAL + ACCOUNT ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          {/* GOAL */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">
              Mục tiêu học tập
            </h2>

            <p className="text-slate-400">
              🎯 JLPT <span className="text-slate-200 font-medium">N3</span>{" "}
              trong 6 tháng
            </p>
            <p className="text-slate-400">⏱ 60 phút học mỗi ngày</p>

            <button className="mt-4 px-5 py-2.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-red-600 cursor-pointer transition">
              Cập nhật mục tiêu
            </button>
          </div>
          {/* ACCOUNT */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">
              Thông tin tài khoản
            </h2>

            <div className="space-y-2 text-slate-400">
              <p>
                Email: <span className="text-slate-200">luong@gmail.com</span>
              </p>
              <p>
                Ngày tham gia: <span className="text-slate-200">01/2025</span>
              </p>
              <p>
                Gói học: <span className="text-slate-200">Free</span>
              </p>
              <p>
                Trạng thái:{" "}
                <span className="text-emerald-400 font-medium">
                  Đang hoạt động
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
