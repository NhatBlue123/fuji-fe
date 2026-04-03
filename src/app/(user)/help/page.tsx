"use client";

import React from "react";
import { 
  Search, 
  ChevronRight, 
  BookOpen, 
  CreditCard, 
  User, 
  Settings, 
  ShieldCheck, 
  LifeBuoy,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

const HELP_CATEGORIES = [
  {
    title: "Tài khoản & Hồ sơ",
    description: "Quản lý cài đặt tài khoản, mật khẩu và bảo mật.",
    icon: User,
    color: "bg-blue-500/10 text-blue-500",
    href: "/help/account"
  },
  {
    title: "Thanh toán & Gói cước",
    description: "Câu hỏi về nạp tiền, nạp xu và đăng ký khóa học.",
    icon: CreditCard,
    color: "bg-emerald-500/10 text-emerald-500",
    href: "/help/billing"
  },
  {
    title: "Hệ thống học tập",
    description: "Cách sử dụng flashcard, JLPT test và các công cụ học.",
    icon: BookOpen,
    color: "bg-amber-500/10 text-amber-500",
    href: "/help/learning"
  },
  {
    title: "Bảo mật & Quyền riêng tư",
    description: "Thông tin về quyền sở hữu dữ liệu và bảo mật 2FA.",
    icon: ShieldCheck,
    color: "bg-rose-500/10 text-rose-500",
    href: "/help/security"
  },
  {
    title: "Cài đặt & Tùy chỉnh",
    description: "Chỉnh sửa giao diện, ngôn ngữ và thông báo.",
    icon: Settings,
    color: "bg-indigo-500/10 text-indigo-500",
    href: "/help/settings"
  },
  {
    title: "Hỗ trợ kỹ thuật",
    description: "Xử lý lỗi truy cập, âm thanh và kết nối video.",
    icon: LifeBuoy,
    color: "bg-cyan-500/10 text-cyan-500",
    href: "/help/technical"
  }
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      {/* Header / Search Hero */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/40 border-b border-muted/50 pt-32 pb-20 px-6">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <div className="absolute top-10 left-10 size-64 bg-secondary rounded-full blur-[120px]" />
            <div className="absolute bottom-10 right-10 size-64 bg-indigo-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Chúng tôi có thể giúp gì được cho bạn?
            </h1>
            <p className="text-lg font-medium text-muted-foreground max-w-2xl mx-auto">
                Tìm kiếm hướng dẫn, mẹo học tập và câu trả lời cho các vấn đề thường gặp tại FUJI.
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-secondary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <Search className="absolute left-5 size-5 text-muted-foreground" />
              <Input 
                placeholder="Nhập từ khóa tìm kiếm (ví dụ: cách nạp tiền, reset mật khẩu...)"
                className="h-16 pl-14 pr-6 rounded-2xl border-2 border-muted bg-white dark:bg-slate-950/60 shadow-xl focus:border-secondary focus:ring-0 text-lg font-black transition-all placeholder:font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-sm font-bold text-muted-foreground mr-2">Tìm kiếm phổ biến:</span>
            {["Nạp xu", "Quên mật khẩu", "Hủy gói cước", "Lịch học"].map(tag => (
              <Button key={tag} variant="secondary" className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-secondary/10 hover:text-secondary dark:hover:text-secondary text-xs h-8 font-black uppercase tracking-wider transition-all border-none text-slate-600 dark:text-slate-300">
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-secondary font-black">Trung tâm giúp đỡ</h2>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Khám phá các chủ đề được quan tâm nhiều nhất</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HELP_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link key={i} href={cat.href} className="group">
                <Card className="h-full bg-white dark:bg-slate-900/40 border-muted hover:border-secondary/30 shadow-sm hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 rounded-[2rem] overflow-hidden group-hover:-translate-y-2">
                  <CardContent className="p-8 space-y-6">
                    <div className={cn("size-14 rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110", cat.color)}>
                      <Icon className="size-7" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-secondary transition-colors">{cat.title}</h3>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-secondary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 uppercase tracking-widest">
                      Tìm hiểu thêm <ChevronRight className="size-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Support CTA */}
      <div className="max-w-4xl mx-auto px-6">
         <Card className="bg-gradient-to-br from-secondary to-indigo-600 border-none rounded-[3rem] shadow-2xl overflow-hidden shadow-secondary/30">
            <CardContent className="p-12 text-center text-white space-y-8 relative overflow-hidden">
               <div className="absolute top-[-50px] right-[-50px] size-64 bg-white/10 rounded-full blur-3xl" />
               
               <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tight">Vẫn chưa tìm thấy câu trả lời?</h3>
                  <p className="text-white/80 font-bold max-w-xl mx-auto leading-relaxed">
                    Đừng lo lắng, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng 24/7 để giúp bạn giải quyết mọi khó khăn.
                  </p>
               </div>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-secondary hover:bg-white/90 font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95">
                    <MessageCircle className="size-5 mr-3" /> Chat ngay với FUJI
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-2 border-white/30 hover:border-white text-white bg-transparent hover:bg-white/10 font-black uppercase tracking-widest text-sm transition-all active:scale-95">
                    <LifeBuoy className="size-5 mr-3" /> Gửi yêu cầu hỗ trợ
                  </Button>
               </div>

               <div className="flex items-center justify-center gap-8 pt-4 opacity-70">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Hỗ trợ 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Phản hồi dưới 30p</span>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
