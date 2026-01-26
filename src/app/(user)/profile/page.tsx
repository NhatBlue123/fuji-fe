import Link from "next/link";
import { Edit, LogOut } from "lucide-react";
export default function ProfilePage() {
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
            <p className="text-slate-400">
              Người học tiếng Nhật • Trình độ N5
            </p>
            <p className="text-slate-400">
              Mục tiêu: <span className="text-slate-200 font-medium">JLPT N3</span>
            </p>
          </div>

          <div className="flex gap-3">
             <Link
            href="/profile/edit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-zinc-800 hover:bg-red-600 transition"
          >
            <Edit size={16} />
            Chỉnh sửa hồ sơ
          </Link>
            <button className="px-5 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white cursor-pointer transition">
              Đăng xuất
            </button>
          </div>
        </div>

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
              🎯 JLPT <span className="text-slate-200 font-medium">N3</span> trong 6 tháng
            </p>
            <p className="text-slate-400">
              ⏱ 60 phút học mỗi ngày
            </p>

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
              <p>Email: <span className="text-slate-200">luong@gmail.com</span></p>
              <p>Ngày tham gia: <span className="text-slate-200">01/2025</span></p>
              <p>Gói học: <span className="text-slate-200">Free</span></p>
              <p>
                Trạng thái:{" "}
                <span className="text-emerald-400 font-medium">Đang hoạt động</span>
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
