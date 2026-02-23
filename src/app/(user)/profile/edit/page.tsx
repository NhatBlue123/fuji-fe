"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, User, Phone, BookOpen } from "lucide-react";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  /* ===== MOCK DATA (GET /api/me) ===== */
  const [form, setForm] = useState({
    fullname: "Dương Công Lượng",
    phone: "0123456789",
    gender: "male",
    jlpt_level: "N5",
    bio: "Đam mê học tiếng Nhật 🇯🇵",
    avatar: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: any) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);

    const data = new FormData();
    data.append("fullname", form.fullname);
    data.append("phone", form.phone);
    data.append("gender", form.gender);
    data.append("jlptLevel", form.jlpt_level);
    data.append("bio", form.bio);
    if (avatarFile) data.append("avatar", avatarFile);

    // await fetch("/api/profile", { method: "PATCH", body: data });

    setTimeout(() => {
      setIsSaving(false);
      router.push("/profile");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-100">Chỉnh sửa hồ sơ</h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* ===== LEFT: AVATAR ===== */}
          <div className="flex flex-col items-center gap-4">
            <div className="mt-20 w-46 h-46 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl overflow-hidden">
              {form.avatar ? (
                <Image
                  src={form.avatar}
                  alt="avatar"
                  width={144}
                  height={144}
                />
              ) : (
                <User size={48} />
              )}
            </div>

            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm">
              <Upload size={16} /> Đổi ảnh
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* ===== RIGHT: FORM ===== */}
          <div className="md:col-span-2 space-y-5">
            <Input
              label="Họ và tên"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
            />

            <Input
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              icon={<Phone size={16} />}
            />

            {/* Gender */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Giới tính
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            {/* JLPT */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Trình độ JLPT
              </label>
              <select
                name="jlpt_level"
                value={form.jlpt_level}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Giới thiệu
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Input ===== */
function Input({ label, icon, ...props }: any) {
  return (
    <div>
      <label className="text-sm text-slate-300 mb-1 block">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200`}
        />
      </div>
    </div>
  );
}
