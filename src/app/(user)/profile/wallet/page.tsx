"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, 
  Search, ChevronLeft, ChevronRight,
  TrendingUp, History, Download, Info, CreditCard, MoreHorizontal,
  ChevronDown
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-primary/20 bg-primary/5 text-primary mb-2">
            <CreditCard size={12} /> Tài khoản thanh toán
          </Badge>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Ví <span className="text-primary drop-shadow-sm">Fuji</span>
          </h1>
          <p className="text-muted-foreground">Quản lý số dư và lịch sử giao dịch của bạn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push("/premium?tab=topup")}
            size="lg"
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="mr-2" size={18} strokeWidth={3} /> Nạp Tiền
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/withdraw')}
            size="lg"
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs border-muted-foreground/20 hover:bg-muted/50"
          >
            <ArrowUpRight className="mr-2" size={18} strokeWidth={3} /> Rút Tiền
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Wallet Card */}
        <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] to-[#111827] text-white relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
          
          <CardHeader className="relative z-10 pt-10 px-10">
            <div className="flex items-center gap-3 text-white/60">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <Wallet size={20} className="text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tổng số dư khả dụng</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info size={14} className="opacity-40 hover:opacity-100 text-primary" /></TooltipTrigger>
                  <TooltipContent className="bg-[#0B1120] border-white/10 text-[10px] text-white">Số dư dùng để thanh toán dịch vụ Fuji</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 px-10 pb-12 pt-4">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                {balance.toLocaleString()}
              </span>
              <span className="text-3xl font-black text-white/30 uppercase tracking-tighter">đ</span>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                  🌸
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">Tương đương</div>
                  <div className="text-xl font-black text-white">{(balance / 1000).toLocaleString()} <span className="text-[10px] text-white/30 ml-1">HOA</span></div>
                </div>
              </div>
              
              <div className="ml-auto flex gap-3">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Download size={20} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <MoreHorizontal size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0B1120] border-white/10 text-white">
                    <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">Lấy mã QR thanh toán</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">Cài đặt thông báo</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 text-rose-400 cursor-pointer">Báo cáo sự cố</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Stats */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-primary/20 bg-primary/5 shadow-lg group overflow-hidden h-[180px] relative transition-transform hover:-translate-y-1">
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
            <CardHeader className="pb-2">
              <CardDescription className="text-primary/70 font-black uppercase tracking-[0.2em] text-[10px]">Giao dịch tháng này</CardDescription>
              <CardTitle className="text-5xl font-black text-primary">{historyData?.totalElements || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
                <ArrowUpRight size={14} className="animate-pulse" /> +12.5% vs tháng trước
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted/60 h-[100px] flex items-center justify-between px-8 transition-transform hover:-translate-y-1">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Hạng thành viên</p>
              <p className="text-xl font-black text-foreground uppercase tracking-tighter">Premium User</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 rotate-12 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
              <TrendingUp size={24} className="-rotate-12" />
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Section */}
      <Card className="shadow-lg border-muted/60 overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <History size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold uppercase tracking-tight">Lịch sử giao dịch</CardTitle>
              <CardDescription>Chi tiết các biến động số dư của bạn</CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex p-1 bg-muted/30 border border-muted rounded-xl ring-1 ring-black/5">
              {["ALL", "DEPOSIT", "WITHDRAW"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === type 
                    ? "bg-background text-primary shadow-sm ring-1 ring-black/5" 
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "ALL" ? "Tất cả" : type === "DEPOSIT" ? "Nạp vào" : "Chi tiêu"}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Mã giao dịch..."
                className="pl-10 pr-4 h-11 w-full rounded-xl bg-muted/30 border border-muted focus:ring-primary/30 outline-none transition-all text-xs font-bold uppercase tracking-widest"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 uppercase text-[10px] font-black tracking-widest text-muted-foreground">
              <TableRow>
                <TableHead className="px-8 h-12">Mã giao dịch</TableHead>
                <TableHead className="px-8 h-12">Loại</TableHead>
                <TableHead className="px-8 h-12 text-right">Số tiền</TableHead>
                <TableHead className="px-8 h-12">Số dư còn lại</TableHead>
                <TableHead className="px-8 h-12 text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: Transaction) => (
                <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors group border-b last:border-0">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-sm ${
                        tx.type === "DEPOSIT" || tx.amount > 0 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                        : "bg-primary/5 text-primary border-primary/20"
                      }`}>
                        {tx.type === "DEPOSIT" || tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold uppercase tracking-tighter">
                          {tx.referenceId || `TX-${String(tx.id).slice(-6).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tx.type === "DEPOSIT" ? "Nạp tiền" : "Chi trả dịch vụ"}
                  </TableCell>
                  <TableCell className={`px-8 py-6 text-right font-black text-xl tracking-tighter ${tx.type === "DEPOSIT" || tx.amount > 0 ? "text-emerald-500" : ""}`}>
                    {tx.type === "DEPOSIT" || tx.amount > 0 ? "+" : "-"}{tx.amount.toLocaleString()} 
                    <span className="text-[10px] ml-1 opacity-40">đ</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 font-semibold text-xs text-muted-foreground">
                    {tx.balanceAfter.toLocaleString()} <span className="text-[10px] opacity-40 whitespace-nowrap">đ</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase ring-0">
                      Thành công
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                        <History size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-widest">Chưa có giao dịch</p>
                        <p className="text-[11px] text-muted-foreground mb-4">Mọi hoạt động của bạn sẽ được ghi lại tại đây</p>
                        <Button variant="outline" size="sm" className="rounded-xl px-6 text-[10px] font-black uppercase transition-all tracking-widest hover:bg-primary hover:text-white border-primary/20 hover:border-primary">
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
          <CardFooter className="py-6 border-t flex flex-col md:flex-row items-center justify-between gap-6 px-10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-xl h-11 w-11 border-muted hover:bg-muted"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? "default" : "outline"}
                    onClick={() => setPage(i)}
                    className={`h-11 w-11 rounded-xl font-bold text-xs ${page === i ? "shadow-lg shadow-primary/20" : "border-muted hover:bg-muted"}`}
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
                className="rounded-xl h-11 w-11 border-muted hover:bg-muted"
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

// Reuse or extract to component
function LoadingState() {
  return (
    <div className="min-h-[400px] flex flex-col justify-center items-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-muted rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Fuji Wallet</p>
        <p className="text-muted-foreground/50 font-bold uppercase tracking-widest text-[8px] animate-pulse">Loading secure data...</p>
      </div>
    </div>
  );
}