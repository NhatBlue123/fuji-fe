"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Edit, Key, LogOut, Mail, Phone, User, BookOpen, Calendar,
  History, ShieldCheck, Zap, Star, LayoutGrid, ArrowLeft,
  ChevronRight, Award, Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/auth";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: user, isLoading, error, isUninitialized } = useGetCurrentUserQuery();

  if (!mounted || isLoading || isUninitialized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto py-8 px-4">
      {/* Hero Header Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-[#0B1120] to-[#111827] text-white relative shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl p-1 bg-gradient-to-br from-primary via-cyan-400 to-indigo-500 shadow-2xl">
                <div className="w-full h-full rounded-[1.4rem] bg-[#0B1120] overflow-hidden relative border-4 border-[#0B1120]">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="avatar" className="object-cover" fill sizes="160px" />
                  ) : (
                    <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-cyan-400">
                      {getInitials(user.fullName)}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-[#0B1120] rounded-xl shadow-lg ring-1 ring-white/10" />
            </div>

            {/* User Info Section */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                    {user.fullName}
                  </h1>
                  <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3">
                    Premium
                  </Badge>
                </div>
                <p className="text-cyan-400 font-bold tracking-widest uppercase text-xs">@{user.username}</p>
              </div>

              <p className="text-slate-400 max-w-xl text-sm leading-relaxed italic">
                "{user.bio || "Chưa có lời tựa cho bản thân... Hãy cập nhật hồ sơ để chia sẻ thêm về bạn."}"
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <Button asChild className="rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                  <Link href="/profile/edit">
                    <Edit size={16} className="mr-2" /> Chỉnh sửa
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setOpenLogout(true)} className="rounded-xl h-10 px-6 bg-white/5 border-white/10 text-white hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all">
                  <LogOut size={16} className="mr-2" /> Đăng xuất
                </Button>
              </div>
            </div>

            {/* Stats Sidebar / Level */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center space-y-3 min-w-[180px]">
              <div className="p-3 bg-primary/20 rounded-2xl w-fit mx-auto border border-primary/30">
                <Trophy size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hạng học tập</p>
                <p className="text-xl font-black text-white">Sliver II</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">350 / 500 EXP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg border-muted/60">
            <CardHeader className="border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <User size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
                  <CardDescription>Liên hệ và trình độ ngôn ngữ của bạn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem icon={<Mail size={16} />} label="Email liên hệ" value={user.email} />
                <InfoItem icon={<Phone size={16} />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
                <InfoItem icon={<Calendar size={16} />} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString("vi-VN")} />
                <InfoItem icon={<BookOpen size={16} />} label="Trình độ" value={`Tiếng Nhật - ${user.jlptLevel || "Chưa xác định"}`} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard 
              href="/profile/change-password"
              icon={<Key size={20} />}
              title="Bảo mật tài khoản"
              desc="Đổi mật khẩu định kỳ"
              color="cyan"
            />
            <ActionCard 
              href="/profile/wallet"
              icon={<Zap size={20} />}
              title="Ví FUJI"
              desc="Quản lý số dư của bạn"
              color="primary"
            />
          </div>
        </div>

        {/* Right Column - Stats Grid */}
        <div className="space-y-4">
          <Card className="shadow-lg border-muted/60 h-full">
            <CardHeader>
              <CardTitle className="text-lg">Thống kê học tập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem icon={<Star className="text-yellow-500" />} label="Điểm học" value="1,250" />
              <Separator className="opacity-50" />
              <StatItem icon={<LayoutGrid className="text-blue-500" />} label="Khóa học" value="08" />
              <Separator className="opacity-50" />
              <StatItem icon={<ShieldCheck className="text-emerald-500" />} label="Bảo mật" value="Cao" />
              <Separator className="opacity-50" />
              <StatItem icon={<Award className="text-indigo-500" />} label="Chứng chỉ" value="02" />
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                Xem chi tiết lịch sử <ChevronRight size={14} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Logout Modal */}
      {openLogout && (
        <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full border-muted/60 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="text-rose-500" size={28} />
              </div>
              <CardTitle className="text-xl font-bold">Bạn muốn đăng xuất?</CardTitle>
              <CardDescription>Hành động này sẽ kết thúc phiên làm việc hiện tại của bạn.</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-3 p-6 pt-2">
              <Button variant="outline" onClick={() => setOpenLogout(false)} className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                Hủy
              </Button>
              <Button onClick={handleLogout} className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20">
                Xác nhận
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="p-3 bg-muted/40 rounded-xl text-muted-foreground group-hover:text-primary transition-colors border border-transparent group-hover:border-primary/20">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted/40 rounded-lg">{icon}</div>
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color }: { href: string, icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <Link href={href} className="group">
      <Card className="hover:border-primary/50 transition-all shadow-sm hover:shadow-md cursor-pointer h-full relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`p-3 bg-muted/40 group-hover:bg-primary/10 rounded-xl text-muted-foreground group-hover:text-primary transition-all border border-transparent group-hover:border-primary/20`}>
            {icon}
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="font-bold text-sm tracking-tight">{title}</h4>
            <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  );
}