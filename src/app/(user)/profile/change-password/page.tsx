"use client";

import { useState, useEffect } from "react";
import { 
  Eye, EyeOff, Lock, ArrowLeft, AlertCircle, 
  KeyRound, ShieldCheck, CheckCircle2, Info,
  Save, ShieldAlert
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
    if (strength <= 2) return { label: "Yếu", color: "bg-rose-500" };
    if (strength <= 3) return { label: "Trung bình", color: "bg-orange-500" };
    if (strength <= 4) return { label: "Khá", color: "bg-blue-500" };
    return { label: "Rất mạnh", color: "bg-emerald-500" };
  };

  const { label: strengthLabel, color: strengthColor } = getStrengthConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải từ 8 ký tự trở lên.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      alert("Mật khẩu đã thay đổi thành công. Vui lòng đăng nhập lại!");
      localStorage.removeItem("access_token");
      router.push("/login");
    } catch (err: any) {
      setError(err?.data?.message || "Mật khẩu hiện tại không chính xác.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto py-8 px-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Đổi mật khẩu</h1>
          <p className="text-muted-foreground">Cập nhật mật khẩu định kỳ để bảo đảm an toàn cho tài khoản.</p>
        </div>
        <Badge variant="secondary" className="w-fit h-fit px-3 py-1 gap-2 border-primary/20 bg-primary/5 text-primary">
          <ShieldCheck size={14} /> Bảo mật 2 lớp
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <Card className="lg:col-span-2 shadow-lg border-muted/60">
          <form onSubmit={handleSubmit}>
            <CardHeader className="border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <KeyRound size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg">Thông tin mật khẩu</CardTitle>
                  <CardDescription>Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-8 space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Lock size={14} className="text-primary" />
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng..."
                    className="h-12 bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <KeyRound size={14} className="text-primary" />
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự..."
                      className="h-12 bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Độ mạnh mật khẩu</span>
                      <span className={strength <= 2 ? "text-rose-500" : strength <= 4 ? "text-primary" : "text-emerald-500"}>
                        {strengthLabel}
                      </span>
                    </div>
                    <Progress value={strengthPercent} className={`h-1.5 ${strengthColor}`} />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary" />
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="h-12 bg-muted/30 border-muted focus-visible:ring-primary/30 font-medium pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    confirmPassword === newPassword 
                      ? "text-emerald-500" 
                      : "text-rose-500"
                  }`}>
                    {confirmPassword === newPassword ? "✓ Mật khẩu đã khớp" : "✗ Xác nhận không chính xác"}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                Hủy thay đổi
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Cập nhật mật khẩu
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Info/Security Tips Section */}
        <div className="space-y-4">
          <Card className="shadow-lg border-muted/60">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                <ShieldCheck size={16} /> Lời khuyên bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Sử dụng tối thiểu 8 ký tự",
                "Kết hợp chữ HOA, thường và số",
                "Thêm ký tự đặc biệt (!, @, #, $...)",
                "Không dùng thông tin cá nhân",
                "Thay đổi mật khẩu sau 3-6 tháng",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-muted-foreground font-medium leading-tight">{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardContent className="pt-6 flex gap-4">
              <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Quan trọng</p>
                <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                  Sau khi đổi mật khẩu thành công, bạn sẽ bị đăng xuất khỏi tất cả các thiết bị khác để đảm bảo an toàn.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 rounded-xl border bg-primary/5 flex items-start gap-3 border-primary/10">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground font-medium">Bạn có đang gặp sự cố? <Link href="/support" className="text-primary hover:underline">Liên hệ hỗ trợ</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}