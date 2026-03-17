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
        
        {/* ================= HERO SECTION ================= */}
        <div className="relative h-[300px] w-full overflow-hidden">
          {/* Background Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-pink-900" />
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {/* Animated Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[80%] bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[80%] bg-pink-500/20 blur-[120px] rounded-full" />
        </div>

        {/* ================= MAIN CONTENT ================= */}
        <div className="px-4 md:px-8 -mt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: PROFILE CARD */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/20">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group p-1 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-800 flex items-center justify-center text-4xl font-black text-white overflow-hidden relative">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="avatar" className="object-cover" fill />
                      ) : (
                        getInitials(user.fullName)
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-lg" />
                  </div>

                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {user.fullName}
                  </h1>
                  <p className="text-cyan-500 font-bold text-sm tracking-widest uppercase mt-1">
                    @{user.username}
                  </p>
                  
                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold dark:text-slate-400 border dark:border-white/5">
                      JLPT {user.jlptLevel}
                    </span>
                    <span className="px-3 py-1 bg-pink-500/10 rounded-full text-[10px] font-bold text-pink-500 border border-pink-500/20">
                      PREMIUM
                    </span>
                  </div>

                  <p className="mt-6 text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                    "{user.bio || "Chưa có lời tựa cho bản thân..."}"
                  </p>
                </div>

                <div className="mt-8 space-y-3 pt-8 border-t dark:border-white/5">
                  <Button asChild className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 font-bold hover:scale-[1.02] transition-transform">
                    <Link href="/profile/edit"><Edit size={16} className="mr-2" /> Chỉnh sửa hồ sơ</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setOpenLogout(true)}
                    className="w-full h-12 rounded-2xl border-slate-200 dark:border-white/10 dark:text-white font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
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
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500"><User size={20}/></div>
                    Thông tin chi tiết
                  </h2>
                  <Link href="/profile/edit" className="text-xs font-bold text-cyan-500 hover:underline">Thay đổi</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailItem icon={<Mail />} label="Email liên hệ" value={user.email} />
                  <DetailItem icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
                  <DetailItem icon={<Calendar />} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString("vi-VN")} />
                  <DetailItem icon={<BookOpen />} label="Trình độ ngôn ngữ" value={`Tiếng Nhật - ${user.jlptLevel}`} />
                </div>
              </div>

              {/* ACTION BUTTONS (LỊCH SỬ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/profile/history-payment" className="group p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-between hover:scale-[1.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <History size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-white">Lịch sử giao dịch</h4>
                      <p className="text-xs text-slate-400">Xem lại các gói đã mua</p>
                    </div>
                  </div>
                </Link>

                <Link href="/profile/change-password" className="group p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-between hover:scale-[1.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl text-cyan-400 group-hover:bg-cyan-400 group-hover:text-white transition-all">
                      <Key size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-white">Bảo mật tài khoản</h4>
                      <p className="text-xs text-slate-400">Đổi mật khẩu định kỳ</p>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-black dark:text-white mb-2 text-slate-900">Đăng xuất?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Hành động này sẽ kết thúc phiên làm việc của bạn trên trình duyệt này.</p>
            <div className="flex gap-3">
              <button onClick={() => setOpenLogout(false)} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-white/5 dark:text-white text-slate-600">Hủy</button>
              <button onClick={handleLogout} className="flex-1 py-4 rounded-2xl font-black bg-red-500 text-white shadow-lg shadow-red-500/30">Xác nhận</button>
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
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col items-center gap-2 shadow-sm transition-transform hover:-translate-y-1">
      <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl">{icon}</div>
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-lg font-black dark:text-white text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 group-hover:text-cyan-500 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</p>
        <p className="font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
