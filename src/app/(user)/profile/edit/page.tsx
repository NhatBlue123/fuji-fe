"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Sparkles, ArrowLeft, Save, ShieldCheck, Camera, GraduationCap, PenTool } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/services/user/userApi";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
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
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const [updateProfile] = useUpdateProfileMutation();
  const { data: user, isLoading, isUninitialized } = useGetCurrentUserQuery();

  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "MALE",
    jlptLevel: "",
    bio: "",
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        gender: user.gender || "MALE",
        jlptLevel: user.jlptLevel || "",
        bio: user.bio || "",
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          data.append(key, value);
        }
      });
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      await updateProfile(data).unwrap();
      // force reload to get updated avatar instead of cached one
      window.location.href = "/profile";
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  };

  if (!mounted || isLoading || isUninitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-12 pt-2">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        
        {/* Simple Header */}
        <div className="flex items-start gap-4 mb-6 ml-2">
          <button 
            type="button"
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-500 hover:text-pink-500 dark:text-muted-foreground dark:hover:text-pink-400 transition-colors rounded-full hover:bg-pink-500/5 mt-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-foreground">
              Cấu Hình Hồ Sơ
            </h1>
            <p className="text-sm text-muted-foreground">
              Thông tin cá nhân được cập nhật
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            
            {/* Avatar Section */}
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-pink-500 text-white flex items-center justify-center text-3xl font-bold shadow-md overflow-hidden relative border-4 border-white dark:border-card">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="avatar" className="object-cover" fill sizes="96px" />
                  ) : (
                    getInitials(form.fullName)
                  )}
                </div>
                {/* Camera Overlay */}
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-card hover:bg-pink-600 transition-colors">
                  <Camera size={14} className="text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              
              {/* Full Name */}
              <div className="md:col-span-2 space-y-2">
                <CustomLabel icon={<PenTool size={16} className="text-pink-500" />} label="Họ và tên đã đặt" />
                <UIInput 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleChange}
                  placeholder="Nhập họ và tên..."
                  className="h-11 bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <CustomLabel icon={<Phone size={16} className="text-pink-500" />} label="Số điện thoại" />
                <UIInput 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange}
                  placeholder="Nhập SĐT..."
                  className="h-11 bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <CustomLabel icon={<User size={16} className="text-pink-500" />} label="Giới tính" />
                <UISelect 
                  value={form.gender} 
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-secondary focus:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium">
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
              <div className="md:col-span-2 space-y-2">
                <CustomLabel icon={<GraduationCap size={16} className="text-pink-500" />} label="Trình độ tiếng Nhật (JLPT)" />
                <UISelect 
                  value={form.jlptLevel} 
                  onValueChange={(v) => setForm({ ...form, jlptLevel: v })}
                >
                  <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-secondary focus:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium">
                    <SelectValue placeholder="Chọn cấp độ JLPT" />
                  </SelectTrigger>
                  <SelectContent>
                    {["N1", "N2", "N3", "N4", "N5"].map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-2">
                <CustomLabel icon={<Sparkles size={16} className="text-pink-500" />} label="Tiểu sử bản thân" />
                <Textarea 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange}
                  placeholder="Kể về hành trình chinh phục tiếng Nhật của bạn..."
                  className="resize-none min-h-[100px] bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium"
                />
              </div>
              
            </div>

            <hr className="border-slate-100 dark:border-border my-8" />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/profile")}
                className="w-full sm:w-auto sm:flex-1 h-11 border-slate-200 text-slate-600 hover:text-pink-500 hover:bg-pink-500/5 hover:border-pink-400/50 dark:border-border dark:text-slate-300 dark:hover:text-pink-400 dark:hover:bg-pink-500/5 dark:hover:border-pink-500/30 transition-all"
              >
                Hủy thay đổi
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto sm:flex-1 h-11 bg-pink-500 hover:bg-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 transition-all"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Lưu hồ sơ mới
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CustomLabel({ label, icon }: { label: string, icon?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {icon}
      {label}
    </label>
  );
}
