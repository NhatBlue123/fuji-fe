"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Phone, Sparkles, ArrowLeft, Save, 
  Camera, GraduationCap, PenTool, ShieldCheck, Info
} from "lucide-react";
import { useUpdateProfileMutation } from "@/store/services/user/userApi";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500 relative selection:bg-pink-500/30">
      {/* Background Glowing Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] right-[15%] w-[400px] h-[400px] bg-pink-500/10 dark:bg-pink-500/10 blur-[120px] rounded-full animate-pulse opacity-70" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto py-8 px-4 relative z-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted/50 pb-8">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-pink-500 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Trở về
          </button>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            Chỉnh sửa <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">Hồ Sơ</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Cập nhật thông tin chi tiết của bạn.</p>
        </div>
        <Badge variant="secondary" className="w-fit h-fit px-3 py-1.5 gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[9px]">
          <ShieldCheck size={14} /> Đã xác thực bảo vệ
        </Badge>
      </div>

      <Card className="shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl transition-all duration-500 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="relative z-10">
          <CardHeader className="space-y-4 pb-10 pt-10 border-b dark:border-white/5 mx-8 px-0">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Premium Avatar Container */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl p-1 bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-500 shadow-2xl transition-all duration-500 group-hover:scale-105 active:scale-95 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                  <div className="w-full h-full rounded-[1.4rem] bg-[#0B1120] overflow-hidden relative flex items-center justify-center border-4 border-[#0B1120]">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="avatar" className="object-cover" fill sizes="160px" />
                    ) : (
                      <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-cyan-400">
                        {getInitials(form.fullName)}
                      </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                      <div className="p-3 bg-black/50 rounded-2xl shadow-xl border border-white/10">
                        <Camera size={28} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0B1120] border-2 border-white/10 shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-2xl flex items-center justify-center text-pink-500 transform transition-transform group-hover:rotate-12 group-hover:scale-110">
                   <PenTool size={18} />
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center">
                <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">Ảnh đại diện</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1 text-muted-foreground">Nhấp để cập nhật diện mạo</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-10 px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <User size={14} className="text-pink-500" />
                  Họ và tên
                </label>
                <Input 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleChange}
                  placeholder="Nhập họ tên đầy đủ..."
                  className="h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner"
                />
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <Phone size={14} className="text-emerald-500" />
                  Số điện thoại liên hệ
                </label>
                <Input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange}
                  placeholder="09xx..."
                  className="h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner"
                />
              </div>

              {/* Gender */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <Sparkles size={14} className="text-cyan-500" />
                  Giới tính
                </label>
                <Select 
                  value={form.gender} 
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger className="h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus:ring-pink-500/30 font-bold text-foreground dark:text-white shadow-inner">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-[#0f1218] border border-white/10 rounded-xl rounded-t-none border-t-0 p-1">
                    <SelectItem value="MALE" className="font-bold py-3 hover:text-pink-400 focus:bg-pink-500/10 focus:text-pink-400">Nam</SelectItem>
                    <SelectItem value="FEMALE" className="font-bold py-3 hover:text-pink-400 focus:bg-pink-500/10 focus:text-pink-400">Nữ</SelectItem>
                    <SelectItem value="OTHER" className="font-bold py-3 hover:text-pink-400 focus:bg-pink-500/10 focus:text-pink-400">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* JLPT */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <GraduationCap size={14} className="text-purple-500" />
                  Trình độ cao nhất
                </label>
                <Select 
                  value={form.jlptLevel} 
                  onValueChange={(v) => setForm({ ...form, jlptLevel: v })}
                >
                  <SelectTrigger className="h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus:ring-pink-500/30 font-bold text-foreground dark:text-white shadow-inner pl-4">
                    <SelectValue placeholder="Chọn cấp độ JLPT phù hợp với bạn" />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-[#0f1218] border border-white/10 rounded-xl rounded-t-none border-t-0 p-1">
                    {["N1", "N2", "N3", "N4", "N5"].map((n) => (
                      <SelectItem key={n} value={n} className="font-bold py-3 hover:text-pink-400 focus:bg-pink-500/10 focus:text-pink-400">
                        Chứng chỉ {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <PenTool size={14} className="text-amber-500" />
                  Ghi chú riêng / Giới thiệu
                </label>
                <Textarea 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange}
                  placeholder="Khát vọng học tập hay đôi lời tản mạn..."
                  className="resize-none min-h-[140px] p-4 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 dark:bg-black/20 border-t dark:border-white/5 p-6 md:p-8 flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/profile")}
              className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-muted dark:border-white/10 dark:text-slate-400 dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/5"
            >
              Hủy thay đổi
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-[2] h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Lưu toàn bộ
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="p-5 rounded-2xl border bg-cyan-500/5 dark:bg-[#0B1120]/60 flex items-start gap-4 border-cyan-500/20 dark:backdrop-blur-xl shadow-lg shadow-black/5 mt-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 shadow-inner">
          <Info className="h-5 w-5 text-cyan-500" />
        </div>
        <div className="space-y-1 mt-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Lưu ý bảo mật thông tin</p>
          <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 leading-relaxed max-w-2xl">
            Tất cả dữ liệu hồ sơ của bạn được mã hóa an toàn ở DB 2 lớp. Một số thông tin như JLPT sẽ giúp hệ thống đề xuất bài thi thông minh hơn.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}