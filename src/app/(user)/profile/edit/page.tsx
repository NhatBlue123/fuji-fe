import Link from "next/link";

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Chỉnh sửa hồ sơ
            </h1>
            <p className="text-slate-400 mt-1">
              Cập nhật thông tin cá nhân và mục tiêu học tập
            </p>
          </div>

          <Link
            href="/profile"
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Quay lại hồ sơ
          </Link>
        </div>

        {/* ================= FORM ================= */}
        <form className="space-y-10">

          {/* ===== BASIC INFO ===== */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-100">
              Thông tin cơ bản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  defaultValue="Dương Công Lượng"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="luong@gmail.com"
                  disabled
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* ===== STUDY INFO ===== */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-100">
              Thông tin học tập
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Trình độ hiện tại
                </label>
                <select className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none">
                  <option>N5</option>
                  <option>N4</option>
                  <option>N3</option>
                  <option>N2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Mục tiêu JLPT
                </label>
                <select className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-700 focus:border-indigo-500 focus:outline-none">
                  <option>N4</option>
                  <option selected>N3</option>
                  <option>N2</option>
                  <option>N1</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Thời gian học mỗi ngày (phút)
                </label>
                <input
                  type="number"
                  defaultValue={60}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Thời gian đạt mục tiêu (tháng)
                </label>
                <input
                  type="number"
                  defaultValue={6}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ===== ACTIONS ===== */}
          <div className="flex justify-end gap-4">
            <Link
              href="/profile"
              className="px-6 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Hủy
            </Link>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-red-600 transition"
            >
              Lưu thay đổi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
