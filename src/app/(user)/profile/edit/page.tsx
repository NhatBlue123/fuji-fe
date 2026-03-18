"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, User, Phone } from "lucide-react";
import Image from "next/image";
import { useUpdateProfileMutation } from "@/store/services/user/userApi";
import { Button } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditProfilePage() {
  const router = useRouter();
  const [updateProfile] = useUpdateProfileMutation();

  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    fullName: "Dương Công Lượng",
    phone: "0123456789",
    gender: "MALE",
    jlptLevel: "N5",
    bio: "Đam mê học tiếng Nhật 🇯🇵",
    avatar: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);

    // preview ảnh ngay
    setForm({
      ...form,
      avatar: URL.createObjectURL(file),
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = new FormData();

      data.append("fullName", form.fullName);
      data.append("phone", form.phone);
      data.append("gender", form.gender);
      data.append("jlptLevel", form.jlptLevel);
      data.append("bio", form.bio);

      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      await updateProfile(data).unwrap();

      alert("Cập nhật thành công");
      router.push("/profile");
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-8">
          Chỉnh sửa hồ sơ
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* ===== AVATAR ===== */}
          <div className="flex flex-col items-center gap-4">
            <div className="mt-8 w-40 h-40 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl overflow-hidden">
              {form.avatar ? (
                <Image
                  src={form.avatar}
                  alt="avatar"
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={60} />
              )}
            </div>

            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition">
              <Upload size={16} /> Đổi ảnh
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* ===== FORM ===== */}
          <div className="md:col-span-2 space-y-5">
            <Input
              label="Họ và tên"
              name="fullName"
              value={form.fullName}
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
              <UISelect
                value={form.gender}
                onValueChange={(v) =>
                  handleChange({ target: { name: "gender", value: v } } as any)
                }
              >
                <SelectTrigger className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </UISelect>
            </div>

            {/* JLPT */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Trình độ JLPT
              </label>
              <UISelect
                value={form.jlptLevel}
                onValueChange={(v) =>
                  handleChange({
                    target: { name: "jlptLevel", value: v },
                  } as any)
                }
              >
                <SelectTrigger className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">
                  <SelectValue placeholder="Chọn trình độ" />
                </SelectTrigger>
                <SelectContent>
                  {["N5", "N4", "N3", "N2", "N1"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </UISelect>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Giới thiệu
              </label>
              <Textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition"
              >
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

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
        <UIInput
          {...props}
          className={`w-full ${
            icon ? "pl-10" : "pl-4"
          } pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200`}
        />
      </div>
    </div>
  );
}
