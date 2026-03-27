"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Phone, Sparkles, ArrowLeft, Save, 
  Camera, GraduationCap, PenTool, CheckCircle2, 
  ShieldCheck, Info
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin và diện mạo của bạn trên hệ thống.</p>
        </div>
        <Badge variant="secondary" className="w-fit h-fit px-3 py-1 gap-2 border-primary/20 bg-primary/5 text-primary">
          <ShieldCheck size={14} /> Tài khoản bảo mật
        </Badge>
      </div>

      <Card className="shadow-lg border-muted/60">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-4 pb-8 border-b">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-cyan-400 p-1 shadow-2xl transition-all hover:scale-105 active:scale-95 group-hover:shadow-primary/20">
                  <div className="w-full h-full rounded-[1.4rem] bg-background overflow-hidden relative flex items-center justify-center border-4 border-background">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="avatar" className="object-cover" fill sizes="128px" />
                    ) : (
                      <span className="text-4xl font-bold text-primary">{getInitials(form.fullName)}</span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                      <Camera size={28} className="text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-background border border-muted shadow-xl rounded-2xl flex items-center justify-center text-primary">
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
                <CardTitle className="text-xl font-bold">Ảnh đại diện</CardTitle>
                <CardDescription>Nhấp để thay đổi ảnh</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <User size={14} className="text-primary" />
                  Họ và tên
                </label>
                <Input 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleChange}
                  placeholder="Nhập họ tên đầy đủ..."
                  className="h-12 bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} className="text-primary" />
                  Số điện thoại
                </label>
                <Input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange}
                  placeholder="09xx..."
                  className="h-12 bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Sparkles size={14} className="text-primary" />
                  Giới tính
                </label>
                <Select 
                  value={form.gender} 
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-muted focus:ring-primary/30 font-medium">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* JLPT */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <GraduationCap size={14} className="text-primary" />
                  Trình độ JLPT
                </label>
                <Select 
                  value={form.jlptLevel} 
                  onValueChange={(v) => setForm({ ...form, jlptLevel: v })}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-muted focus:ring-primary/30 font-medium">
                    <SelectValue placeholder="Chọn cấp độ JLPT" />
                  </SelectTrigger>
                  <SelectContent>
                    {["N1", "N2", "N3", "N4", "N5"].map((n) => (
                      <SelectItem key={n} value={n} className="font-semibold">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <PenTool size={14} className="text-primary" />
                  Giới thiệu bản thân
                </label>
                <Textarea 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange}
                  placeholder="Chia sẻ về mục tiêu học tiếng Nhật của bạn..."
                  className="resize-none min-h-[120px] bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/profile")}
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-xs border-muted-foreground/20 hover:bg-background"
            >
              Hủy thay đổi
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Lưu thay đổi
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="p-4 rounded-xl border bg-primary/5 flex items-start gap-4 border-primary/10">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary">Lưu ý bảo mật</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thông tin của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế. Một số thông tin như JLPT sẽ giúp hệ thống gợi ý bài học phù hợp hơn.
          </p>
        </div>
      </div>
    </div>
  );
}