"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Edit, Key, LogOut, Mail, Phone, User, BookOpen, Calendar,
  History, ShieldCheck, Zap, Star, LayoutGrid
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/auth";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: user, isLoading, error, isUninitialized } = useGetCurrentUserQuery();

  if (!mounted || isLoading || isUninitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !user) {
    router.push("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] transition-colors duration-500 pb-20">
      <div className="mx-auto max-w-7xl lg:pl-16"> {/* Chừa chỗ cho Sidebar 64px */}
        
        {/* ================= HERO SECTION (Sync with Flashcards) ================= */}
        <section className="relative w-full h-[300px] rounded-t-3xl overflow-hidden bg-[#0B1120] border-x border-t border-white/5 shadow-2xl group">
          <div className="absolute inset-0 bg-slate-900"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          
          <div className="absolute bottom-0 left-0 right-0 h-full w-full pointer-events-none opacity-40">
            <svg
              className="absolute bottom-0 w-full h-auto"
              preserveAspectRatio="none"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#be185d" stopOpacity="1"></stop>
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.1"
              ></path>
              <path
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.2"
              ></path>
            </svg>
          </div>
        </section>

        {/* ================= MAIN CONTENT ================= */}
        <div className="px-4 md:px-8 -mt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: PROFILE CARD */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/40">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group p-1 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 mb-6 shadow-lg shadow-pink-500/20">
                    <div className="w-32 h-32 rounded-full border-4 border-[#0B1120] bg-slate-800 flex items-center justify-center text-4xl font-black text-white overflow-hidden relative">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="avatar" className="object-cover" fill />
                      ) : (
                        getInitials(user.fullName)
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-[#0B1120] rounded-full shadow-lg" />
                  </div>

                  <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm">
                    {user.fullName}
                  </h1>
                  <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mt-1">
                    @{user.username}
                  </p>
                  
                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 border border-white/10 shadow-inner">
                      JLPT {user.jlptLevel}
                    </span>
                    <span className="px-3 py-1 bg-pink-500/10 rounded-full text-[10px] font-bold text-pink-400 border border-pink-500/20 shadow-inner">
                      PREMIUM
                    </span>
                  </div>

                  <p className="mt-6 text-blue-100/60 text-sm leading-relaxed italic">
                    "{user.bio || "Chưa có lời tựa cho bản thân..."}"
                  </p>
                </div>

                <div className="mt-8 space-y-3 pt-8 border-t border-white/10">
                  <Button asChild className="relative w-full group overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-lg hover:shadow-pink-500/20 transition-all h-12">
                    <Link href="/profile/edit">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-center justify-center gap-2 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/5 text-white w-full h-full rounded-2xl transition-all duration-300">
                        <Edit size={16} className="text-pink-400 group-hover:text-pink-200" /> 
                        <span className="font-bold tracking-wide">Chỉnh sửa hồ sơ</span>
                      </div>
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setOpenLogout(true)}
                    className="w-full h-12 rounded-2xl border-white/10 bg-transparent text-white font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                  >
                    <LogOut size={16} className="mr-2" /> Đăng xuất
                  </Button>
                </div>
              </div>

              
            </div>

            {/* RIGHT COLUMN: DETAILS & STATS */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* STATS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickStat icon={<Zap className="text-yellow-400" />} label="Cấp độ" value="Sliver II" />
                <QuickStat icon={<Star className="text-pink-500" />} label="Điểm học" value="1,250" />
                <QuickStat icon={<LayoutGrid className="text-cyan-400" />} label="Khóa học" value="08" />
                <QuickStat icon={<ShieldCheck className="text-emerald-400" />} label="Bảo mật" value="Cao" />
              </div>

              {/* INFORMATION GRID */}
              <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 shadow-inner">
                      <User size={20}/>
                    </div>
                    Thông tin chi tiết
                  </h2>
                  <Link href="/profile/edit" className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors">THAY ĐỔI</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailItem icon={<Mail />} label="Email liên hệ" value={user.email} />
                  <DetailItem icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
                  <DetailItem icon={<Calendar />} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString("vi-VN")} />
                  <DetailItem icon={<BookOpen />} label="Trình độ ngôn ngữ" value={`Tiếng Nhật - ${user.jlptLevel}`} />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/profile/change-password" className="group relative overflow-hidden rounded-[2rem] p-[1px] shadow-lg hover:shadow-cyan-500/20 transition-all">
                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   <div className="relative flex items-center justify-between gap-4 p-6 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/5 border border-white/10 rounded-[2rem] transition-all h-full">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 group-hover:bg-cyan-400/20 group-hover:border-cyan-400/30 transition-all shadow-inner">
                        <Key size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white group-hover:text-cyan-200 transition-colors">Bảo mật tài khoản</h4>
                        <p className="text-xs text-blue-100/50 mt-1">Đổi mật khẩu định kỳ</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/profile/wallet" className="group relative overflow-hidden rounded-[2rem] p-[1px] shadow-lg hover:shadow-pink-500/20 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between gap-4 p-6 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/5 border border-white/10 rounded-[2rem] transition-all h-full">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-pink-400 group-hover:bg-pink-400/20 group-hover:border-pink-400/30 transition-all shadow-inner">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white group-hover:text-pink-200 transition-colors">Ví FUJI</h4>
                        <p className="text-xs text-blue-100/50 mt-1">Quản lý số dư của bạn</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LOGOUT MODAL (Glassmorphism) */}
      {openLogout && (
        <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0B1120]/90 border border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl shadow-black/50 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <LogOut className="text-red-400" size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Đăng xuất?</h3>
              <p className="text-blue-100/60 text-sm mb-8 font-medium">Bạn có chắc chắn muốn kết thúc phiên làm việc trên thiết bị này không?</p>
              <div className="flex gap-3">
                <button onClick={() => setOpenLogout(false)} className="flex-1 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all">Hủy</button>
                <button onClick={handleLogout} className="flex-1 py-4 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- SUB-COMPONENTS CHO SẠCH CODE --- */

function QuickStat({ icon, label, value }: any) {
  return (
    <div className="bg-[#0B1120]/60 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center gap-2 shadow-sm transition-transform hover:-translate-y-1 backdrop-blur-xl">
      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl shadow-inner">{icon}</div>
      <div className="text-center mt-2">
        <p className="text-[10px] font-black text-pink-200/50 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-lg font-black text-white leading-tight mt-1">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-blue-200/40 group-hover:text-pink-400 group-hover:border-pink-500/20 group-hover:bg-pink-500/10 transition-all shadow-inner">
        {icon}
      </div>
      <div className="mt-1">
        <p className="text-[10px] font-black text-blue-200/40 uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className="font-bold text-slate-200 text-sm">{value}</p>
      </div>
    </div>
  );
}