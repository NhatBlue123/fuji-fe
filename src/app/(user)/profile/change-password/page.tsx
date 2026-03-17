"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowLeft, ShieldCheck, Sparkles, AlertCircle, ShieldAlert, Fingerprint, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/store/services/user/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường bảo mật.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải từ 8 ký tự để đảm bảo an toàn.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp, vui lòng kiểm tra lại.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      alert("Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại!");
      localStorage.removeItem("access_token");
      router.push("/");
    } catch (err: any) {
      setError(err?.data?.message || "Mật khẩu hiện tại không chính xác.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 relative overflow-hidden flex flex-col">
      
      {/* Background Decor cực mạnh cho màn hình rộng */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-pink-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col mx-auto max-w-7xl w-full px-6 lg:px-12 py-12">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-slate-500 hover:text-cyan-400 transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl bg-white/5 group-hover:bg-cyan-500/10 border border-white/5 transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="tracking-widest uppercase text-xs">Trở về hồ sơ</span>
          </button>

          <div className="flex items-center gap-4 hidden md:flex">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái bảo mật</p>
              <p className="text-sm font-bold text-emerald-500">Tài khoản an toàn</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1 items-center">
          
          {/* LEFT COLUMN: Visual & Info (Chiếm 5/12) */}
          <div className="lg:col-span-5 space-y-8 hidden lg:block">
            <div className="space-y-4">
              <h1 className="text-5xl font-black leading-tight">
                THIẾT LẬP <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500">
                  MẬT MÃ MỚI
                </span>
              </h1>
              <p className="text-slate-400 max-w-md leading-relaxed font-medium">
                Cập nhật mật khẩu định kỳ giúp bảo vệ tiến trình học tập và dữ liệu cá nhân của bạn khỏi các truy cập trái phép.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SecurityCard 
                icon={<Fingerprint size={24} className="text-cyan-400" />}
                title="Xác thực 2 lớp"
                desc="Tăng cường bảo vệ tài khoản sau khi đổi mật mã."
              />
              <SecurityCard 
                icon={<KeyRound size={24} className="text-pink-400" />}
                title="Mã hóa End-to-End"
                desc="Thông tin mật khẩu của bạn được mã hóa đa tầng."
              />
            </div>

            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-yellow-500">
                    <ShieldAlert size={20}/>
                    <span className="text-xs font-black uppercase tracking-widest">Lời khuyên</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Mật khẩu mạnh nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt như @, #, $...</p>
            </div>
          </div>

          {/* RIGHT COLUMN: The Form Card (Chiếm 7/12) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-[550px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
              
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">Đổi mật khẩu</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                
                <PasswordField 
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showPassword}
                  placeholder="Nhập mật mã đang dùng"
                />

                <div className="space-y-3">
                  <PasswordField 
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showPassword}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="flex gap-2 px-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                            newPassword.length > i * 1.5 ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-white/5'
                          }`} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                <PasswordField 
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showPassword}
                  placeholder="Nhập lại mật mã mới"
                />

                <div className="flex items-center justify-between pt-2">
                   <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPassword ? "Ẩn thông tin" : "Hiện mật khẩu"}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-xs font-bold animate-in fade-in zoom-in-95">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black shadow-2xl shadow-cyan-500/20 disabled:opacity-50 transition-all group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                       HỆ THỐNG ĐANG XỬ LÝ...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm">
                      Lưu mật mã mới <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest opacity-60">
                Security Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENTS PHỤ CHO LAYOUT NGANG ===== */

function SecurityCard({ icon, title, desc }: any) {
    return (
        <div className="flex items-start gap-5 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1 uppercase tracking-tight text-sm">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed uppercase">{desc}</p>
            </div>
        </div>
    )
}

function PasswordField({ label, value, onChange, show, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">
        {label}
      </label>
      <div className="relative group">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-16 bg-white/[0.04] border-white/5 rounded-2xl px-6 text-white font-mono text-lg focus:ring-2 focus:ring-cyan-500/40 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 placeholder:font-sans placeholder:text-sm"
          placeholder={placeholder}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-cyan-500 transition-colors">
          <Lock size={20} />
        </div>
      </div>
    </div>
  );
}