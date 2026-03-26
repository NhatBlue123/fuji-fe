"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowLeft, AlertCircle, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/store/services/user/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

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
  const strengthLabel = ["", "Yếu", "Trung bình", "Khá", "Mạnh", "Rất mạnh"][strength];
  const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"][strength];

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
      router.push("/");
    } catch (err: any) {
      setError(err?.data?.message || "Mật khẩu hiện tại không chính xác.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-12 pt-2">
      <div className="max-w-3xl mx-auto px-4 md:px-6">

        {/* Header - matching profile edit style */}
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
              Đổi mật khẩu
            </h1>
            <p className="text-sm text-muted-foreground">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form Card */}
          <div className="lg:col-span-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

              {/* Current Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Lock size={16} className="text-pink-500" />
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    className="h-11 bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <KeyRound size={16} className="text-pink-500" />
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="h-11 bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNew(!showNew)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            strength >= i ? strengthColor : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                      Độ mạnh: {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <ShieldCheck size={16} className="text-pink-500" />
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="h-11 bg-slate-50/50 dark:bg-secondary focus-visible:ring-pink-500/30 text-slate-900 dark:text-foreground font-medium pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p className={`text-[11px] font-medium ${
                    confirmPassword === newPassword 
                      ? "text-emerald-500" 
                      : "text-red-500"
                  }`}>
                    {confirmPassword === newPassword ? "✓ Mật khẩu khớp" : "✗ Mật khẩu không khớp"}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                  <AlertCircle size={18} className="flex-shrink-0" /> {error}
                </div>
              )}

              <hr className="border-slate-100 dark:border-border" />

              {/* Buttons - matching profile edit & settings style */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto sm:flex-1 h-11 border-slate-200 text-slate-600 hover:text-pink-500 hover:bg-pink-500/5 hover:border-pink-400/50 dark:border-border dark:text-slate-300 dark:hover:text-pink-400 dark:hover:bg-pink-500/5 dark:hover:border-pink-500/30 transition-all"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto sm:flex-1 h-11 bg-pink-500 hover:bg-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 transition-all"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock size={18} />
                  )}
                  Lưu mật khẩu mới
                </Button>
              </div>
            </form>
          </div>

          {/* Side Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-pink-500" />
                Lời khuyên bảo mật
              </h3>
              <ul className="space-y-3 text-xs text-slate-500 dark:text-muted-foreground">
                {[
                  "Sử dụng ít nhất 8 ký tự",
                  "Kết hợp chữ hoa và chữ thường",
                  "Sử dụng số và ký tự đặc biệt (@, #, $...)",
                  "Không dùng thông tin cá nhân",
                  "Đổi mật khẩu định kỳ mỗi 3 tháng",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">⚠️ Lưu ý</p>
              <p className="text-xs text-amber-600 dark:text-amber-400/80 leading-relaxed">
                Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên tất cả thiết bị.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}