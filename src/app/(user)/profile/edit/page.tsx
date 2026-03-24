"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Sparkles, ChevronLeft, Save, ShieldCheck } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState({
    fullName: "Dương Công Lượng",
    phone: "0123456789",
    gender: "MALE",
    jlptLevel: "N5",
    bio: "Đam mê học tiếng Nhật 🇯🇵",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      await updateProfile(data).unwrap();
      router.push("/profile");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 pb-20 selection:bg-pink-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-8 pt-12">
        {/* Header & Back Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-slate-500 hover:text-pink-400 transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all shadow-inner">
              <ChevronLeft size={20} />
            </div>
            <span className="tracking-widest uppercase text-[10px]">Quay lại</span>
          </button>

          <div className="text-left md:text-right">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase flex items-center md:justify-end gap-3">
              Cấu hình <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm font-black">Hồ sơ</span>
            </h1>
            <div className="flex items-center md:justify-end gap-2 mt-1">
               <ShieldCheck size={14} className="text-pink-400" />
               <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Thông tin cá nhân được bảo mật</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
            {/* Form Glow Effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              
              {/* Full Name */}
              <div className="md:col-span-2 group">
                <CustomLabel label="Họ và tên đầy đủ" />
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-pink-400 transition-colors" size={18} />
                  <UIInput 
                    name="fullName" 
                    value={form.fullName} 
                    onChange={handleChange}
                    className="h-16 pl-12 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 transition-all text-white font-bold tracking-wide shadow-inner"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <CustomLabel label="Số điện thoại" />
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                  <UIInput 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange}
                    className="h-16 pl-12 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 text-white font-bold tracking-widest shadow-inner"
                  />
                </div>
              </div>

              {/* Gender Select */}
              <div className="group">
                <CustomLabel label="Giới tính" />
                <UISelect 
                  value={form.gender} 
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger className="h-16 bg-white/5 border border-white/10 rounded-2xl text-white font-bold px-6 focus:ring-4 focus:ring-pink-500/10 shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c14] border-white/10 text-white rounded-2xl">
                    <SelectItem value="MALE" className="focus:bg-blue-500/20 focus:text-blue-400">Nam</SelectItem>
                    <SelectItem value="FEMALE" className="focus:bg-pink-500/20 focus:text-pink-400">Nữ</SelectItem>
                    <SelectItem value="OTHER" className="focus:bg-purple-500/20 focus:text-purple-400">Khác</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>

              {/* JLPT Select */}
              <div className="md:col-span-2 group">
                <CustomLabel label="Trình độ tiếng Nhật (JLPT)" />
                <UISelect 
                  value={form.jlptLevel} 
                  onValueChange={(v) => setForm({ ...form, jlptLevel: v })}
                >
                  <SelectTrigger className="h-16 bg-white/5 border border-white/10 rounded-2xl text-white font-bold px-6 focus:ring-4 focus:ring-pink-500/10 shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c14] border-white/10 text-white rounded-2xl grid grid-cols-5">
                    {["N1", "N2", "N3", "N4", "N5"].map((n) => (
                      <SelectItem key={n} value={n} className="focus:bg-pink-500/20 font-black">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 group">
                <CustomLabel label="Tiểu sử bản thân" />
                <Textarea 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange}
                  placeholder="Kể về hành trình chinh phục tiếng Nhật của bạn..."
                  className="min-h-[140px] bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 transition-all font-medium leading-relaxed shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full sm:flex-1 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 font-bold transition-all uppercase tracking-widest text-[11px] shadow-inner"
            >
              Hủy thay đổi
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="relative group overflow-hidden w-full sm:flex-[2] h-16 rounded-[1.5rem] bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl hover:shadow-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-center gap-3 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/10 text-white w-full h-full rounded-[1.5rem] transition-all duration-300">
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="uppercase tracking-widest text-xs font-black">Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} className="text-pink-400 group-hover:text-pink-200" /> 
                    <span className="uppercase tracking-[0.2em] text-xs font-black">Lưu hồ sơ mới</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomLabel({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-2 transition-colors group-focus-within:text-pink-400">
      <Sparkles size={12} className="text-pink-500" /> {label}
    </label>
  );
}
