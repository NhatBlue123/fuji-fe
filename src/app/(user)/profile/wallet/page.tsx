"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, 
  Search, ChevronLeft, ChevronRight, ArrowLeft,
  TrendingUp, History, Download, Info, CreditCard, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetWalletHistoryQuery, useGetWalletQuery } from "@/store/services/walletApi";
import { Transaction } from "@/types/wallet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FujiWallet() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>("ALL");
  const size = 10;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: wallet, isLoading: isWalletLoading } = useGetWalletQuery();
  const { data: historyData, isLoading: isHistoryLoading } = useGetWalletHistoryQuery({ page, size });

  const balance = wallet?.balance || 0;
  const transactions = historyData?.content || [];
  const totalPages = historyData?.totalPages || 0;

  if (!mounted) return null;
  if (isWalletLoading || isHistoryLoading) return <LoadingState />;

  return (
    // Đổi selection-bg sang pink
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto py-8 px-4 selection:bg-pink-500/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-muted/50 pb-8">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-pink-500 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
          {/* Badge - Chuyển sang tone hồng mờ */}
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-pink-500/20 bg-pink-500/5 text-pink-500 dark:text-pink-400 mb-2">
            <CreditCard size={12} /> Tài khoản thanh toán
          </Badge>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Ví <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">Fuji</span>
          </h1>
          <p className="text-muted-foreground">Quản lý số dư và lịch sử giao dịch của bạn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Nạp Tiền Button - Chủ đạo Hồng */}
          <Button 
            onClick={() => router.push("/premium?tab=topup")}
            size="lg"
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-pink-500/20 bg-pink-400 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-500 text-white transition-all active:scale-95"
          >
            <Plus className="mr-2" size={18} strokeWidth={3} /> Nạp Tiền
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/withdraw')}
            size="lg"
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs border-muted-foreground/20 hover:bg-pink-400"
          >
            <ArrowUpRight className="mr-2" size={18} strokeWidth={3} /> Rút Tiền
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Wallet Card - Đổi gradient nền sang tông hồng/purle mờ */}
        <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0a0c10] text-white relative shadow-2xl rounded-[2.5rem]">
          {/* Đổi Glow hồng */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <CardHeader className="relative z-10 pt-10 px-10">
            <div className="flex items-center gap-3 text-white/60">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                <Wallet size={20} className="text-pink-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-100/70">Tổng số dư khả dụng</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info size={14} className="opacity-40 hover:opacity-100 text-pink-400" /></TooltipTrigger>
                  <TooltipContent className="bg-[#111827] border border-pink-500/20 text-[10px] text-pink-100 Backdrop-blur-xl">Số dư dùng để thanh toán dịch vụ Fuji</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 px-10 pb-12 pt-4">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {balance.toLocaleString()}
              </span>
              <span className="text-3xl font-black text-pink-500/40 uppercase tracking-tighter">đ</span>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4 group cursor-help">
                {/* Gradient Hoa anh đào đổi sang Pink-Purple */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform duration-500">
                  🌸
                </div>
                <div>
                  <div className="text-[10px] text-pink-100/50 font-black uppercase tracking-widest">Tương đương</div>
                  <div className="text-xl font-black text-white">{(balance / 1000).toLocaleString()} <span className="text-[10px] text-pink-100/30 ml-1">HOA</span></div>
                </div>
              </div>
              
              <div className="ml-auto flex gap-3">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400 transition-colors shadow-inner">
                  <Download size={20} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400 transition-colors shadow-inner">
                      <MoreHorizontal size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0f1218] border border-pink-500/20 text-slate-200 rounded-xl Backdrop-blur-xl min-w-[180px]">
                    <DropdownMenuItem className="hover:bg-pink-500/10 hover:text-pink-300 focus:bg-pink-500/10 focus:text-pink-300 cursor-pointer text-xs font-semibold py-2.5">Lấy mã QR thanh toán</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-pink-500/10 hover:text-pink-300 focus:bg-pink-500/10 focus:text-pink-300 cursor-pointer text-xs font-semibold py-2.5">Cài đặt thông báo</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-rose-500/10 hover:text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 text-rose-400 cursor-pointer text-xs font-semibold py-2.5">Báo cáo sự cố</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Stats */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Thống kê - Chủ đạo Hồng mờ */}
          <Card className="border-pink-500/20 bg-pink-500/5 dark:bg-pink-500/5 shadow-xl shadow-pink-500/5 group overflow-hidden h-[180px] relative transition-all hover:-translate-y-1 hover:border-pink-500/30 rounded-[2rem]">
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-pink-500/10 -rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-pink-500/70 font-black uppercase tracking-[0.2em] text-[10px]">Giao dịch tháng này</CardDescription>
              <CardTitle className="text-5xl font-black text-pink-500 dark:text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">{historyData?.totalElements || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-pink-500 dark:text-pink-400 font-bold text-[10px] uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 inline-flex px-3 py-1.5 rounded-full shadow-inner animate-pulse">
                <ArrowUpRight size={14} /> +12.5% vs tháng trước
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-black/5 border-muted/60 dark:border-white/5 h-[100px] flex items-center justify-between px-8 transition-transform hover:-translate-y-1 rounded-[1.5rem] dark:bg-[#0B1120]/60 dark:Backdrop-blur-xl">
            <div>
              <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Hạng thành viên</p>
              <p className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter">Premium User</p>
            </div>
            {/* Gradient Icon Hạng - Chuyển sang Pink/Purple Crystal */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 rotate-12 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white transition-transform duration-500 hover:rotate-0">
              <TrendingUp size={24} className="-rotate-12 group-hover:rotate-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Section */}
      <Card className="shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 overflow-hidden rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:Backdrop-blur-xl transition-all duration-500">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 dark:bg-pink-500/10 rounded-2xl text-pink-500 dark:text-pink-400 border border-pink-500/20 shadow-inner">
              <History size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">Lịch sử giao dịch</CardTitle>
              <CardDescription className="text-muted-foreground dark:text-slate-400">Chi tiết các biến động số dư của bạn</CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Modern Filter Chip - Active dùng tone hồng */}
            <div className="flex p-1 bg-muted dark:bg-black/20 border dark:border-white/5 rounded-xl ring-1 ring-black/5 shadow-inner backdrop-blur-sm">
              {["ALL", "DEPOSIT", "WITHDRAW"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    filter === type 
                    ? "bg-background text-pink-500 dark:bg-[#111827] dark:text-pink-400 shadow-sm ring-1 ring-black/5 border border-muted dark:border-pink-500/20" 
                    : "text-muted-foreground dark:text-slate-500 hover:text-foreground dark:hover:text-slate-200"
                  }`}
                >
                  {type === "ALL" ? "Tất cả" : type === "DEPOSIT" ? "Nạp vào" : "Chi tiêu"}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-pink-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Mã giao dịch..."
                className="pl-10 pr-4 h-11 w-full rounded-xl bg-muted dark:bg-black/10 border border-muted dark:border-white/5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/30 outline-none transition-all text-xs font-bold uppercase tracking-widest text-foreground dark:text-white placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 dark:bg-black/10 uppercase text-[10px] font-black tracking-widest text-muted-foreground dark:text-slate-500">
              <TableRow className="dark:border-white/5">
                <TableHead className="px-8 h-12">Mã giao dịch</TableHead>
                <TableHead className="px-8 h-12">Loại</TableHead>
                <TableHead className="px-8 h-12 text-right">Số tiền</TableHead>
                <TableHead className="px-8 h-12">Số dư còn lại</TableHead>
                <TableHead className="px-8 h-12 text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: Transaction) => (
                <TableRow key={tx.id} className="hover:bg-muted/20 dark:hover:bg-white/[0.02] transition-colors group border-b dark:border-white/5 last:border-0">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {/* Icon Loại - Nạp đổi sang Cyan cho tương phản, chi tiêu sang Pink */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-inner md:flex-shrink-0 ${
                        tx.type === "DEPOSIT" || tx.amount > 0 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                        : "bg-pink-50 text-pink-500 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20"
                      }`}>
                        {tx.type === "DEPOSIT" || tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold uppercase tracking-tighter text-foreground dark:text-slate-200">
                          {tx.referenceId || `TX-${String(tx.id).slice(-6).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground dark:text-slate-500 font-bold mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground dark:text-slate-500">
                    {tx.type === "DEPOSIT" ? "Nạp tiền" : "Chi trả dịch vụ"}
                  </TableCell>
                  {/* Số tiền - Nạp màu Emerald, chi tiêu màu Trắng/Slate mặc định */}
                  <TableCell className={`px-8 py-6 text-right font-black text-xl tracking-tighter ${tx.type === "DEPOSIT" || tx.amount > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-foreground dark:text-white"}`}>
                    {tx.type === "DEPOSIT" || tx.amount > 0 ? "+" : "-"}{tx.amount.toLocaleString()} 
                    <span className="text-[10px] ml-1 opacity-40">đ</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 font-semibold text-xs text-muted-foreground dark:text-slate-400 tracking-tight">
                    {tx.balanceAfter.toLocaleString()} <span className="text-[10px] opacity-40 whitespace-nowrap">đ</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    {/* Badge thành công - Giữ Emerald */}
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase ring-0 px-3 py-1 shadow-inner">
                      Thành công
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center text-muted-foreground/30 dark:text-slate-700 border dark:border-white/5 shadow-inner">
                        <History size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground dark:text-white">Chưa có giao dịch</p>
                        <p className="text-[11px] text-muted-foreground dark:text-slate-500 mb-4 max-w-xs mx-auto">Mọi hoạt động của bạn sẽ được ghi lại tại đây để tiện theo dõi</p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push('/')}
                            className="rounded-xl px-6 h-9 text-[10px] font-black uppercase transition-all tracking-widest hover:bg-pink-500 hover:text-white border-pink-500/20 hover:border-pink-500 dark:hover:bg-pink-600 shadow-sm"
                        >
                          Quay lại trang chủ
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="py-6 border-t dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 px-10 bg-muted/20 dark:bg-black/10">
            <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-xl h-11 w-11 border-muted dark:border-white/5 dark:bg-[#0B1120] hover:bg-muted dark:hover:bg-white/5 text-foreground dark:text-white"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? "default" : "outline"}
                    onClick={() => setPage(i)}
                    className={`h-11 w-11 rounded-xl font-bold text-xs ${page === i 
                        ? "shadow-lg shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-500 text-white border-pink-500/20" 
                        : "border-muted dark:border-white/5 dark:bg-[#0B1120] hover:bg-muted dark:hover:bg-white/5 text-foreground dark:text-white"}`}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= totalPages}
                className="rounded-xl h-11 w-11 border-muted dark:border-white/5 dark:bg-[#0B1120] hover:bg-muted dark:hover:bg-white/5 text-foreground dark:text-white"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[400px] flex flex-col justify-center items-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-muted dark:border-white/5 rounded-full" />
        {/* Spinner đổi sang hồng */}
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-pink-500 dark:text-pink-400 font-black uppercase tracking-[0.3em] text-[10px]">Fuji Wallet</p>
        <p className="text-muted-foreground/50 font-bold uppercase tracking-widest text-[8px] animate-pulse">Loading secure data...</p>
      </div>
    </div>
  );
}