"use client";

import { useState, useEffect } from "react";
import { 
  Eye, EyeOff, Lock, ArrowLeft, AlertCircle, 
  KeyRound, ShieldCheck, CheckCircle2, Info,
  Save, ShieldAlert, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/store/services/user/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  useEffect(() => setMounted(true), []);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthPercent = (strength / 5) * 100;
  
  const getStrengthConfig = () => {
    if (strength <= 2) return { label: "Yếu", color: "bg-rose-500", text: "text-rose-500", progress: "bg-rose-500/20 [&>div]:bg-rose-500" };
    if (strength <= 3) return { label: "Cơ bản", color: "bg-amber-500", text: "text-amber-500", progress: "bg-amber-500/20 [&>div]:bg-amber-500" };
    if (strength <= 4) return { label: "An toàn", color: "bg-emerald-500", text: "text-emerald-500", progress: "bg-emerald-500/20 [&>div]:bg-emerald-500" };
    return { label: "Rất mạnh", color: "bg-cyan-500", text: "text-cyan-500", progress: "bg-cyan-500/20 [&>div]:bg-cyan-500" };
  };

  const { label: strengthLabel, color: strengthColor, text: strengthText, progress: progressColor } = getStrengthConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Thiếu trường dữ liệu! Vui lòng điền đầy đủ tất cả.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới quá ngắn, tối thiểu phải 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      alert("Mật khẩu đã được thay đổi an toàn! Hệ thống sẽ yêu cầu bạn đăng nhập lại.");
      localStorage.removeItem("access_token");
      router.push("/login");
    } catch (err: any) {
      setError(err?.data?.message || "Mật khẩu hiện tại không đúng. Xin thử lại.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto py-8 px-4 selection:bg-pink-500/30">
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
            Bảo mật <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">Tài Khoản</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Thay đổi mật khẩu định kỳ để bảo vệ dữ liệu trên ứng dụng.</p>
        </div>
        <Badge variant="secondary" className="w-fit h-fit px-3 py-1.5 gap-2 border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest text-[9px] shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          <ShieldCheck size={14} /> Mã hóa E2E đang bật
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <Card className="lg:col-span-2 shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <CardHeader className="border-b dark:border-white/5 pb-8 pt-8 mx-8 px-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500 dark:text-pink-400 border border-pink-500/20 shadow-inner">
                  <KeyRound size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">Thiết lập mật khẩu</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-slate-400 font-medium">Bảo đảm nhập đúng mật khẩu hiện tại</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-8 px-8 space-y-8">
              {/* Current Password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <Lock size={14} className="text-amber-500" />
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mật khẩu bảo mật..."
                    className="h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner pr-14 tracking-widest text-lg placeholder:text-sm placeholder:tracking-normal"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 transition-colors bg-background dark:bg-[#111827] border dark:border-white/10 p-1.5 rounded-lg shadow-sm"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-4 pt-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                    <Sparkles size={14} className="text-pink-500" />
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự..."
                      className={`h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner pr-14 tracking-widest text-lg placeholder:text-sm placeholder:tracking-normal ${newPassword && strength <= 2 ? 'border-rose-500/50 focus-visible:border-rose-500 focus-visible:ring-rose-500/20' : ''}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 transition-colors bg-background dark:bg-[#111827] border dark:border-white/10 p-1.5 rounded-lg shadow-sm"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="p-4 rounded-xl border bg-muted/20 dark:bg-black/20 dark:border-white/5 shadow-inner space-y-3 transition-all duration-300">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground dark:text-slate-500">Độ mạnh mật khẩu</span>
                      <span className={`transition-colors duration-300 ${strengthText}`}>
                        {strengthLabel}
                      </span>
                    </div>
                    <Progress value={strengthPercent} className={`h-1.5 rounded-full ${progressColor}`} />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground dark:text-slate-400 ml-1">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Xác nhận khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại chính xác..."
                    className={`h-14 rounded-xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus-visible:ring-pink-500/30 focus-visible:border-pink-500/50 font-bold text-foreground dark:text-white transition-all shadow-inner pr-14 tracking-widest text-lg placeholder:text-sm placeholder:tracking-normal ${confirmPassword && newPassword && confirmPassword !== newPassword ? 'border-rose-500/50 focus-visible:border-rose-500 ring-rose-500/20' : confirmPassword && newPassword && confirmPassword === newPassword ? 'border-emerald-500/50 focus-visible:border-emerald-500 ring-emerald-500/20' : ''}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 transition-colors bg-background dark:bg-[#111827] border dark:border-white/10 p-1.5 rounded-lg shadow-sm"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mt-2 p-2 rounded-lg ${
                    confirmPassword === newPassword 
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" 
                      : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                  }`}>
                    {confirmPassword === newPassword ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {confirmPassword === newPassword ? "Khớp hoàn toàn" : "Chưa hoàn toàn khớp"}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top-2 shadow-inner">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/10 dark:bg-black/20 border-t dark:border-white/5 p-6 md:p-8 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-muted dark:border-white/10 dark:text-slate-400 dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/5"
              >
                Hủy thay đổi
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-[2] h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Đổi mật khẩu mới
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Info/Security Tips Section */}
        <div className="space-y-6">
          <Card className="shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl">
            <CardHeader className="border-b dark:border-white/5 pb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-emerald-500">
                <ShieldCheck size={18} /> Lời khuyên an toàn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-8">
              {[
                {text:"Sử dụng tối thiểu 8 ký tự", icon: <CheckCircle2 size={16} />},
                {text:"Kết hợp chữ HOA, thường và số", icon: <CheckCircle2 size={16} />},
                {text:"Thêm dấu cách ký tự đặc biệt", icon: <CheckCircle2 size={16} />},
                {text:"Không dùng chung với app khác", icon: <CheckCircle2 size={16} />},
                {text:"Thay đổi định kỳ 30 ngày/lần", icon: <CheckCircle2 size={16} />},
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                    {tip.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-slate-200 transition-colors mt-0.5 leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-amber-500/20 bg-amber-500/5 shadow-2xl rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[30px]" />
            <CardContent className="p-6 md:p-8 flex gap-5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
                <ShieldAlert className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest drop-shadow-sm">Ghi nhớ quan trọng</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-bold">
                  Thay đổi mật khẩu sẽ <span className="text-amber-600 dark:text-amber-400">bắt buộc đăng xuất</span> tại tất cả các thiết bị. Hệ thống sẽ cấp lại access token ngay sau đó!
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-5 rounded-2xl border bg-cyan-500/5 dark:bg-[#0B1120]/60 flex items-center gap-4 border-cyan-500/20 dark:backdrop-blur-xl shadow-lg shadow-black/5 mt-4 group cursor-pointer hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <Info className="h-5 w-5 text-cyan-500" />
            </div>
            <p className="text-[11px] text-muted-foreground dark:text-slate-400 font-bold uppercase tracking-wider">
              Có sự cố đổi MK? <Link href="/support" className="text-cyan-500 hover:text-cyan-400 ml-1 drop-shadow-sm">Kêu gọi hỗ trợ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}