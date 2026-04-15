"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Edit, Key, LogOut, Mail, Phone, User, BookOpen, Calendar,
  ShieldCheck, Zap, Star, LayoutGrid, ChevronRight, Award, Trophy, Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/auth";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { useGetMySubscriptionQuery } from "@/store/services/subscriptionApi";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: user, isLoading, error, isUninitialized } = useGetCurrentUserQuery();
  const { data: mySub, isLoading: isSubLoading } = useGetMySubscriptionQuery(undefined, {
    skip: isLoading || !user,
  });

  // Prefer subscription API tier, fallback to user profile tier, then BASIC
  const displayTier = mySub?.tier || user?.subscriptionTier || 'BASIC';

  if (!mounted || isLoading || isUninitialized || isSubLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex-1 overflow-y-auto relative scroll-smooth selection:bg-pink-500/30">
      
      {/* Hero Section */}
      <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-pink-500/5 bg-background border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[5%] right-[15%] w-[400px] h-[400px] bg-pink-500/10 dark:bg-pink-500/10 blur-[120px] rounded-full animate-pulse opacity-70" />
          <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[120px] rounded-full opacity-60" />
          <div className="w-full h-full bg-cover bg-bottom opacity-20 dark:opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')" }}></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400 mb-4 inline-flex">
            <User size={12} /> Thông tin cá nhân
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3 uppercase">
            Hồ Sơ <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">Cá Nhân</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl md:max-w-2xl leading-relaxed mx-auto md:mx-0">
            Quản lý diện mạo và thông tin liên hệ của bạn.
          </p>
        </div>
      </div>

      {/* Main Content Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 -mt-16 relative z-30 space-y-8 pb-12">

      {/* Hero Header Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#0B1120] dark:via-[#111827] dark:to-[#0a0c10] text-foreground dark:text-white relative shadow-2xl rounded-[2.5rem]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <CardContent className="p-8 md:p-12 relative z-10 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            {/* Avatar Section */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl p-1 bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-500 shadow-2xl">
                <div className="w-full h-full rounded-[1.4rem] bg-background dark:bg-[#0B1120] overflow-hidden relative border-4 border-background dark:border-[#0B1120]">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="avatar" className="object-cover" fill sizes="160px" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-cyan-400">
                      {getInitials(user.fullName)}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-background dark:border-[#0B1120] rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-white/10 dark:ring-white/10" />
            </div>

            {/* User Info Section */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground dark:text-white uppercase drop-shadow-sm">
                    {user.fullName}
                  </h1>
                  <Link href="/profile/subscription">
                    {displayTier === 'PREMIUM' ? (
                      <Badge className="bg-gradient-to-r from-pink-500 to-pink-500 border-none text-white font-black uppercase tracking-widest text-[10px] px-3 py-1 shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95">
                        Premium
                      </Badge>
                    ) : displayTier === 'PRO' ? (
                      <Badge className="bg-gradient-to-r from-cyan-500 to-pink-500 border-none text-white font-black uppercase tracking-widest text-[10px] px-3 py-1 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95">
                        Pro
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted dark:border-white/10 text-muted-foreground dark:text-slate-400 font-black uppercase tracking-widest text-[10px] px-3 py-1 hover:bg-muted/50 dark:hover:bg-white/5 transition-all cursor-pointer hover:border-pink-500/30 hover:text-pink-500 dark:hover:text-pink-400 active:scale-95">
                        Basic
                      </Badge>
                    )}
                  </Link>
                </div>
                <p className="text-cyan-600 dark:text-cyan-400 font-bold tracking-widest uppercase text-xs">@{user.username}</p>
              </div>

              <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm leading-relaxed italic border-l-2 border-pink-500/30 pl-4 py-1">
                "{user.bio || "Chưa có lời tựa cho bản thân... Hãy cập nhật hồ sơ để chia sẻ thêm về bạn."}"
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                <Button asChild className="rounded-2xl h-11 px-6 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-pink-500/20 transition-all">
                  <Link href="/profile/edit"> 
                    <Edit size={16} className="mr-2" /> Chỉnh sửa
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setOpenLogout(true)} className="rounded-2xl h-11 px-6 bg-muted/40 dark:bg-white/5 border-muted dark:border-white/10 text-foreground dark:text-white hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/30 font-black uppercase tracking-widest text-[10px] transition-all">
                  <LogOut size={16} className="mr-2" /> Đăng xuất
                </Button>
              </div>
            </div>

            {/* Stats Sidebar / Level */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-muted dark:border-white/10 p-6 rounded-3xl text-center space-y-3 min-w-[200px] shadow-inner shadow-black/5 dark:shadow-none shrink-0 lg:ml-auto">
              <div className="p-3 bg-secondary hover:bg-secondary/90 rounded-2xl w-fit mx-auto border border-white/20 shadow-lg shadow-pink-500/20">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600/80 dark:text-pink-100/60">Hạng học tập</p>
                <p className="text-xl font-black text-foreground dark:text-white tracking-tighter uppercase drop-shadow-md">Silver II</p>
              </div>
              <div className="w-full h-2 bg-muted/80 dark:bg-black/40 rounded-full overflow-hidden border border-muted dark:border-white/5 shadow-inner">
                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 w-[65%]" />
              </div>
              <p className="text-[10px] font-black text-pink-600/70 dark:text-pink-100/50 uppercase tracking-widest">350 / 500 EXP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
  {/* Left Column - Details (Chiếm 2 phần) */}
  <div className="lg:col-span-2">
    <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 rounded-[2.5rem]">
      <CardHeader className="border-b dark:border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 shadow-inner">
            <User size={24} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">Thông tin chi tiết</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-slate-400">Liên hệ và trình độ ngôn ngữ của bạn</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InfoItem icon={<Mail size={16} />} label="Email liên hệ" value={user.email} color="cyan" />
          <InfoItem icon={<Phone size={16} />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} color="text-blue-500 dark:text-blue-400" />
          <InfoItem icon={<Calendar size={16} />} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString("vi-VN")} color="purple" />
          <InfoItem icon={<BookOpen size={16} />} label="Trình độ" value={`Tiếng Nhật - ${user.jlptLevel || "Chưa xác định"}`} color="pink text-blue-500 dark:text-blue-400" />
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Right Column - Actions (Chiếm 1 phần) */}
  <div className="lg:col-span-1 space-y-6 grid gap-2">
    <ActionCard 
      href="/profile/change-password"
      icon={<Key size={24} />}
      title="Bảo mật tài khoản"
      desc="Đổi mật khẩu định kỳ"
      color="amber bg-secondary hover:bg-secondary/90"
    />
    <ActionCard 
      href="/profile/wallet"
      icon={<Zap size={24} />}
      title="Ví FUJI"
      desc="Quản lý số dư của bạn"
      color="pink bg-secondary hover:bg-secondary/90"
    />
  </div>
</div>

      {/* Logout Modal */}
      {openLogout && (
        <div className="fixed inset-0 bg-background/80 dark:bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full border-muted/60 dark:border-white/10 shadow-2xl overflow-hidden rounded-[2.5rem] bg-background dark:bg-[#111827]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="text-center pt-10 pb-4 relative z-10">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <LogOut className="text-rose-500" size={32} />
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground dark:text-white">Bạn muốn đăng xuất?</CardTitle>
              <CardDescription className="text-xs font-medium mt-2">Hành động này sẽ kết thúc phiên làm việc hiện tại của bạn.</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-3 p-8 pt-4 relative z-10">
              <Button variant="outline" onClick={() => setOpenLogout(false)} className="flex-1 h-12 rounded-xl border-muted dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-foreground dark:text-white dark:hover:bg-white/10">
                Hủy
              </Button>
              <Button onClick={handleLogout} className="flex-1 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20">
                Xác nhận
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const getColors = () => {
    const map: Record<string, string> = {
      cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    }
    return map[color] || map.cyan;
  }

  return (
    <div className="flex items-start gap-4 group">
      <div className={`p-3 rounded-2xl transition-transform duration-300 border shadow-inner shrink-0 group-hover:-translate-y-1 ${getColors()}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-sm tracking-tight text-foreground dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const getColors = () => {
    switch (color) {
      case "yellow": return "bg-yellow-500/10 border-yellow-500/20";
      case "blue": return "bg-blue-500/10 border-blue-500/20";
      case "emerald": return "bg-emerald-500/10 border-emerald-500/20";
      case "indigo": return "bg-indigo-500/10 border-indigo-500/20";
      default: return "bg-primary/10 border-primary/20";
    }
  };

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl border transition-transform group-hover:scale-110 shadow-inner ${getColors()}`}>{icon}</div>
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{label}</span>
      </div>
      <span className="text-xl font-black text-foreground dark:text-white tracking-tighter">{value}</span>
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color }: { href: string, icon: React.ReactNode, title: string, desc: string, color: string }) {
  const getColors = () => {
    switch (color) {
      case "amber": return {
          glow: "bg-amber-500/10 group-hover:bg-amber-500/20",
          iconContainer: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          titleHover: "group-hover:text-amber-500"
      };
      case "pink": return {
          glow: "bg-pink-500/10 group-hover:bg-pink-500/20",
          iconContainer: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
          titleHover: "group-hover:text-pink-500"
      };
      default: return {
          glow: "bg-primary/10 group-hover:bg-primary/20",
          iconContainer: "bg-primary/10 text-primary border-primary/20",
          titleHover: "group-hover:text-primary"
      };
    }
  };
  
  const c = getColors();

  return (
    <Link href={href} className="group">
      <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl shadow-xl shadow-black/5 border-muted/60 dark:border-white/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-pointer h-full relative overflow-hidden rounded-[2rem]">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] transition-colors duration-500 ${c.glow}`} />
        <CardContent className="p-8 flex items-center gap-6">
          <div className={`p-4 rounded-2xl border shadow-inner transition-transform duration-500 group-hover:scale-110 shrink-0 ${c.iconContainer}`}>
            {icon}
          </div>
          <div className="flex-1 space-y-1 z-10">
            <h4 className={`font-bold text-sm uppercase tracking-tight text-foreground dark:text-white transition-colors ${c.titleHover}`}>{title}</h4>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-widest">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}