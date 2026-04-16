"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Crown, History, Calendar, Star,
  CheckCircle2, AlertCircle, RefreshCw, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useGetMySubscriptionQuery, 
  useGetSubscriptionHistoryQuery, 
  useToggleAutoRenewMutation 
} from "@/store/services/subscriptionApi";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading: isUserLoading } = useGetCurrentUserQuery();

  const { data: mySub, isLoading: isSubLoading, refetch } = useGetMySubscriptionQuery(undefined, {
    skip: isUserLoading || !user,
  });
  const { data: history = [], isLoading: isHistoryLoading } = useGetSubscriptionHistoryQuery(undefined, {
    skip: isUserLoading || !user,
  });

  // Compute tier directly from API data
  const currentTier = mySub?.tier || user?.subscriptionTier || 'BASIC';
  const isPro = currentTier === 'PRO' || currentTier === 'PREMIUM';
  const isPremium = currentTier === 'PREMIUM';
  const [toggleAutoRenew, { isLoading: isToggling }] = useToggleAutoRenewMutation();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (isUserLoading || isSubLoading || isHistoryLoading) return <LoadingState />;

  const handleToggleAutoRenew = async (checked: boolean) => {
    try {
      await toggleAutoRenew({ enable: checked }).unwrap();
      toast.success(checked ? "Đã bật gia hạn tự động" : "Đã tắt gia hạn tự động");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Lỗi cập nhật tự động gia hạn");
    }
  };

  const getTierDetails = (tier: string) => {
    if (tier === "PREMIUM") return {
      color: "from-pink-500 to-purple-500",
      textColor: "text-pink-400 dark:text-pink-300",
      icon: <Zap size={24} className="text-white" />,
      label: "AI PLATFORM",
      shadow: "shadow-purple-500/20"
    };
    if (tier === "PRO") return {
      color: "from-cyan-500 to-blue-500",
      textColor: "text-cyan-500 dark:text-cyan-400",
      icon: <Star size={24} className="text-white" />,
      label: "PRO",
      shadow: "shadow-cyan-500/20"
    };
    return {
      color: "from-slate-500 to-gray-500",
      textColor: "text-slate-500 dark:text-slate-400",
      icon: <CheckCircle2 size={24} className="text-white" />,
      label: "BASIC",
      shadow: "shadow-slate-500/10"
    };
  };

  const currentDetails = getTierDetails(currentTier);

  return (
    <main className="flex-1 flex flex-col px-6 overflow-hidden relative selection:bg-pink-500/30">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-background/50 backdrop-blur-md">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-pink-500 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
          
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-pink-500/20 bg-pink-500/5 text-pink-500 dark:text-pink-400 mb-2">
            <Crown size={12} /> Quản lý Gói Sub
          </Badge>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Gói <span className={`drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] ${currentDetails.textColor}`}>{currentTier}</span>
          </h1>
          <p className="text-muted-foreground">Quản lý các đặc quyền và lịch sử đăng ký của bạn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push("/premium")}
            size="lg"
            className="rounded-2xl h-12 px-8 bg-secondary hover:bg-secondary/90 text-white font-bold py-2 transition"
          >
            <Star className="mr-2" size={18} strokeWidth={3} /> Nâng cấp Gói
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Subscription Card */}
        <Card className={`lg:col-span-8 overflow-hidden border border-slate-200/70 bg-gradient-to-br from-white via-[#fff7fb] to-[#f5f8ff] text-slate-900 relative shadow-2xl shadow-pink-500/10 rounded-[2.5rem] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#0a0c10] dark:text-white dark:shadow-black/30`}>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/16 dark:bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] ${currentTier === 'PREMIUM' ? 'bg-purple-400/12 dark:bg-purple-500/10' : 'bg-cyan-400/12 dark:bg-cyan-500/10'} rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none`} />
          
          <CardHeader className="relative z-10 pt-10 px-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-secondary hover:bg-secondary/90 ${currentDetails.color} flex items-center justify-center shadow-lg ${currentDetails.shadow}`}>
                  {currentDetails.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50 mb-1">Gói hiện tại</p>
                  <h3 className={`text-2xl font-black uppercase tracking-widest ${currentDetails.textColor}`}>
                    {currentDetails.label}
                  </h3>
                </div>
              </div>
              
              {mySub?.expireAt && (
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50 mb-1">Thời hạn</p>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    {mySub.daysRemaining > 0 ? `Còn ${mySub.daysRemaining} ngày` : 'Hết hạn'}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 px-10 pb-12 pt-6">
            {mySub && currentTier !== 'BASIC' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-slate-200 backdrop-blur-sm dark:bg-white/5 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="text-pink-400" size={20} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Gia hạn tự động</p>
                      <p className="text-xs text-slate-500 dark:text-white/50">Tự động trừ tiền từ ví Fuji khi hết hạn</p>
                    </div>
                  </div>
                  <Switch 
                    checked={mySub.autoRenew} 
                    onCheckedChange={handleToggleAutoRenew} 
                    disabled={isToggling}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
                
                {mySub.expireAt && (
                   <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
                     <Calendar size={14} />
                     <span>Ngày hết hạn: {new Date(mySub.expireAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                   </div>
                )}
              </div>
            ) : (
               <div className="p-6 rounded-2xl bg-white/80 border border-slate-200 text-center space-y-3 dark:bg-white/5 dark:border-white/10">
                 <AlertCircle className="mx-auto text-slate-400 dark:text-white/40" size={32} />
                 <p className="text-sm font-bold">Bạn đang sử dụng gói Miễn Phí</p>
                 <p className="text-xs text-slate-500 dark:text-white/50">Nâng cấp ngay để mở khóa toàn bộ tính năng học tập và ôn thi JLPT tốt nhất.</p>
               </div>
            )}
            
            {(mySub?.activeFeatures?.length ?? 0) > 0 && (
              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50 mb-4">Quyền lợi của bạn</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mySub?.activeFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className={currentDetails.textColor } />
                      <span className="text-sm text-slate-700 dark:text-white/90">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Info */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-xl shadow-black/5 border-muted/60 dark:border-white/5 h-[140px] flex items-center justify-between px-8 transition-transform hover:-translate-y-1 rounded-[1.5rem] bg-white/90 dark:bg-[#0B1120]/60 dark:backdrop-blur-xl group relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Mức học tập</p>
              <p className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter">
                {isPremium ? 'Hardcore Learner' : (isPro ? 'Serious Learner' : 'Beginner')}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-secondary hover:bg-secondary/90 ${currentDetails.color} rotate-12 flex items-center justify-center shadow-lg text-white transition-transform duration-500 group-hover:rotate-0 relative z-10`}>
              <Crown size={24} className="-rotate-12 group-hover:rotate-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* History Section */}
        <Card className="shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-[#0B1120]/60 dark:backdrop-blur-xl transition-all duration-500">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 dark:bg-pink-500/10 rounded-2xl text-pink-500 dark:text-pink-400 border border-pink-500/20 shadow-inner">
              <History size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">Lịch sử đăng ký</CardTitle>
              <CardDescription className="text-muted-foreground dark:text-slate-400">Các gói bạn đã mua</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 dark:bg-black/10 uppercase text-[10px] font-black tracking-widest text-muted-foreground dark:text-slate-500">
              <TableRow className="dark:border-white/5">
                <TableHead className="px-8 h-12">Mã Gói</TableHead>
                <TableHead className="px-8 h-12">Loại Gói</TableHead>
                <TableHead className="px-8 h-12">Thời Gian</TableHead>
                <TableHead className="px-8 h-12 text-right">Số Tiền</TableHead>
                <TableHead className="px-8 h-12 text-right">Trạng Thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((tx: any) => (
                <TableRow key={tx.id} className="hover:bg-muted/20 dark:hover:bg-white/[0.02] transition-colors group border-b dark:border-white/5 last:border-0">
                   <TableCell className="px-8 py-6 font-mono text-xs font-bold uppercase tracking-tighter text-foreground dark:text-slate-200">
                     SUB-{String(tx.id).slice(-6).toUpperCase()}
                   </TableCell>
                   <TableCell className="px-8 py-6 font-bold text-xs uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                     {tx.tier}
                   </TableCell>
                   <TableCell className="px-8 py-6">
                     <span className="text-[10px] text-muted-foreground dark:text-slate-500 font-bold">
                       {new Date(tx.startDate).toLocaleDateString("vi-VN")} - {new Date(tx.endDate).toLocaleDateString("vi-VN")}
                     </span>
                   </TableCell>
                   <TableCell className="px-8 py-6 text-right font-black tracking-tighter text-foreground dark:text-white">
                     {Number(tx.price || 0).toLocaleString()} <span className="text-[10px] ml-1 opacity-40">đ</span>
                   </TableCell>
                   <TableCell className="px-8 py-6 text-right">
                     <Badge variant="outline" className={`px-3 py-1 text-[9px] font-black uppercase ring-0 shadow-inner border 
                        ${tx.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                          tx.status === 'EXPIRED' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' : 
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                       {tx.status}
                     </Badge>
                   </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center text-muted-foreground/30 dark:text-slate-700 border dark:border-white/5 shadow-inner">
                        <History size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground dark:text-white">Chưa đăng ký gói nào</p>
                        <p className="text-[11px] text-muted-foreground dark:text-slate-500 mb-4 max-w-xs mx-auto">Hãy nâng cấp lên PRO hoặc PREMIUM để nhận được nhiều ưu đãi học tập</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[400px] flex flex-col justify-center items-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-muted dark:border-white/5 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-pink-500 dark:text-pink-400 font-black uppercase tracking-[0.3em] text-[10px]">Cập nhật dữ liệu</p>
      </div>
    </div>
  );
}
