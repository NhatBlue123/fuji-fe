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
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 relative overflow-hidden flex flex-col selection:bg-pink-500/30">
      
      {/* Background Decor cực mạnh cho màn hình rộng */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-pink-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col mx-auto max-w-7xl w-full px-6 lg:px-12 py-12">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-slate-500 hover:text-pink-400 transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 shadow-inner transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="tracking-widest uppercase text-xs">Trở về hồ sơ</span>
          </button>

          <div className="flex items-center gap-4 hidden md:flex">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái bảo mật</p>
              <p className="text-sm font-bold text-emerald-400">Tài khoản an toàn</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <ShieldCheck size={20} className="text-emerald-400" />
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm">
                  MẬT MÃ MỚI
                </span>
              </h1>
              <p className="text-blue-100/60 max-w-md leading-relaxed font-medium">
                Cập nhật mật khẩu định kỳ giúp bảo vệ tiến trình học tập và dữ liệu cá nhân của bạn khỏi các truy cập trái phép.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SecurityCard 
                icon={<Fingerprint size={24} className="text-pink-400" />}
                title="Xác thực 2 lớp"
                desc="Tăng cường bảo vệ tài khoản sau khi đổi mật mã."
              />
              <SecurityCard 
                icon={<KeyRound size={24} className="text-blue-400" />}
                title="Mã hóa End-to-End"
                desc="Thông tin mật khẩu của bạn được mã hóa đa tầng."
              />
            </div>

            <div className="p-6 rounded-[2rem] bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-2 text-yellow-500 relative z-10">
                    <ShieldAlert size={20}/>
                    <span className="text-xs font-black uppercase tracking-widest">Lời khuyên</span>
                </div>
                <p className="text-xs text-blue-100/60 font-medium relative z-10">Mật khẩu mạnh nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt như @, #, $...</p>
            </div>
          </div>

          {/* RIGHT COLUMN: The Form Card (Chiếm 7/12) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-[550px] bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              <div className="lg:hidden text-center mb-8 relative z-10">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">Đổi mật khẩu</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                
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
                            newPassword.length > i * 1.5 ? 'bg-gradient-to-r from-pink-500 to-blue-500 shadow-[0_0_12px_rgba(236,72,153,0.4)]' : 'bg-white/5'
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
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPassword ? "Ẩn thông tin" : "Hiện mật khẩu"}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-xs font-bold animate-in fade-in zoom-in-95 shadow-inner">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="relative group overflow-hidden w-full h-16 rounded-[1.5rem] bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl hover:shadow-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-center gap-3 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/10 text-white w-full h-full rounded-[1.5rem] transition-all duration-300">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="uppercase tracking-widest text-xs font-black">HỆ THỐNG ĐANG XỬ LÝ...</span>
                      </>
                    ) : (
                      <>
                        <span className="uppercase tracking-[0.2em] text-sm font-black">Lưu mật mã mới</span>
                        <Sparkles size={20} className="text-pink-400 group-hover:text-pink-200 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </div>
                </Button>
              </form>

              <p className="mt-8 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest opacity-60 relative z-10">
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
        <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 hover:bg-white/5 transition-colors shadow-sm group">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-pink-500/30 group-hover:bg-pink-500/10 shadow-inner transition-all">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1 uppercase tracking-tight text-sm group-hover:text-pink-200 transition-colors">{title}</h4>
                <p className="text-xs text-blue-100/50 leading-relaxed uppercase">{desc}</p>
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
          className="h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-mono text-lg focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600 placeholder:font-sans placeholder:text-sm shadow-inner"
          placeholder={placeholder}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-400 transition-colors">
          <Lock size={20} />
        </div>
      </div>
    </div>
  );
}