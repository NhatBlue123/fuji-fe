"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Bell, Wallet, ArrowUpRight, ArrowDownLeft, 
  Search, ChevronLeft, ChevronRight,
  TrendingUp, History, Download, CheckCircle2,
  Filter, MoreHorizontal, Info, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TopupContent from "@/components/user-component/premium/TopupContent";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetWalletHistoryQuery, useGetWalletQuery } from "@/store/services/walletApi";
import { Transaction } from "@/types/wallet";

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
  const availableBalance = wallet?.availableBalance || 0
  const transactions = historyData?.content || [];
  const totalPages = historyData?.totalPages || 0;

  if (!mounted) return null;
  if (isWalletLoading || isHistoryLoading) return <LoadingState />;

  return (
    <main className="min-h-screen bg-[#0a0c10] text-slate-200 pb-20 selection:bg-pink-500/30 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 pt-8 space-y-10">
        
        {/* Header - Phân cấp lại để tập trung vào số dư */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest shadow-inner">
              <CreditCard size={12} /> Tài khoản cá nhân
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase">
              Ví <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm font-black">Fuji</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push("/premium?tab=topup")}
              className="relative group overflow-hidden bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl hover:shadow-cyan-500/20 rounded-2xl h-12 transition-all"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="relative flex items-center justify-center gap-2 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/5 text-white w-full h-full rounded-2xl px-8 uppercase text-[11px] font-black tracking-widest transition-all duration-300">
                <Plus className="mr-1 text-cyan-400 group-hover:text-cyan-200" size={18} strokeWidth={3} /> Nạp Tiền
              </div>
            </Button>
            <Button 
              onClick={() => router.push('/withdraw')}
              className="relative group overflow-hidden bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl hover:shadow-pink-500/20 rounded-2xl h-12 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-center gap-2 bg-[#0B1120]/80 backdrop-blur-xl group-hover:bg-white/5 text-white w-full h-full rounded-2xl px-8 uppercase text-[11px] font-black tracking-widest transition-all duration-300">
                <ArrowUpRight className="mr-1 text-pink-400 group-hover:text-pink-200" size={18} strokeWidth={3} /> Rút Tiền
              </div>
            </Button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Wallet Card (8 columns) */}
          <div className="lg:col-span-8 group relative overflow-hidden rounded-[3rem] bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative bg-[#0B1120]/80 rounded-[2.9rem] p-10 h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                      <Wallet size={20} className="text-pink-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Tổng số dư khả dụng</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><Info size={14} className="opacity-40 hover:opacity-100 text-pink-400" /></TooltipTrigger>
                        <TooltipContent className="bg-[#0B1120]/90 border border-white/10 text-[10px] backdrop-blur-xl text-white">Số dư dùng để thanh toán dịch vụ Fuji</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200 drop-shadow-sm tracking-tighter">
                      {availableBalance.toLocaleString()}
                    </span>
                    <span className="text-2xl font-black text-pink-400/50 uppercase tracking-tighter">đ</span>
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <div className="px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest shadow-inner">
                    Live Active
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-pink-500/20">
                    🌸
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-200/50 font-black uppercase tracking-widest">Tương đương</div>
                    <div className="text-xl font-black text-white">{(availableBalance / 1000).toLocaleString()} <span className="text-xs text-blue-200">🌸</span></div>
                  </div>
                </div>
                
                <div className="ml-auto flex gap-3">
                  <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:border-pink-500/30 hover:text-pink-300 hover:bg-pink-500/10 transition-all shadow-inner">
                    <Download size={20} />
                  </button>
                  <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:border-pink-500/30 hover:text-pink-300 hover:bg-pink-500/10 transition-all shadow-inner">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Stats (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-blue-500/20 shadow-2xl p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Giao dịch tháng này</div>
                <div className="text-4xl font-black text-white mb-2">{historyData?.totalElements || 0}</div>
                <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold">
                  <ArrowUpRight size={14} /> +12.5% so với tháng trước
                </div>
              </div>
            </div>

            <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-[2.5rem] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-pink-400/60 uppercase tracking-[0.2em] mb-1">Hạng thành viên</div>
                <div className="text-xl font-black text-white uppercase tracking-tighter">Gold Member</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400 rotate-12 flex items-center justify-center shadow-xl shadow-pink-500/20">
                <TrendingUp size={24} className="text-white -rotate-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Section */}
        <section className="space-y-8 pt-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-pink-400 shadow-inner">
                <History size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Lịch sử giao dịch</h3>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Modern Filter Chip */}
              <div className="flex p-1.5 bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-inner">
                {["ALL", "DEPOSIT", "WITHDRAW"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      filter === type 
                      ? "bg-white/10 text-white shadow-sm border border-white/10" 
                      : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {type === "ALL" ? "Tất cả" : type === "DEPOSIT" ? "Nạp vào" : "Chi tiêu"}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Mã giao dịch..."
                  className="pl-12 pr-6 h-13 w-full md:w-64 rounded-2xl bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all text-[11px] font-bold text-white placeholder:text-slate-600 uppercase tracking-widest shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Table Design */}
          <div className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Thông tin</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Phân loại</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Số tiền</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Số dư sau</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {transactions.map((tx: Transaction) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <EmptyState />}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Hiển thị {transactions.length} trên tổng số {historyData?.totalElements || 0} kết quả
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-all text-slate-400"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-12 h-12 rounded-2xl border text-[11px] font-black transition-all backdrop-blur-xl ${
                      page === i 
                      ? "bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/20" 
                      : "bg-[#0B1120]/60 border-white/10 text-slate-500 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= totalPages}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-all text-slate-400"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// --- Sub-components chuyên sâu ---

function TransactionRow({ tx }: { tx: Transaction }) {
  const isDeposit = tx.type === "DEPOSIT" || tx.amount > 0;
  
  return (
    <tr className="hover:bg-white/[0.02] transition-all group relative">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-inner md:flex-shrink-0 ${
            isDeposit ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-pink-500/10 border-pink-500/20 text-pink-400"
          }`}>
            {isDeposit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-tighter">
              {tx.referenceId || `TX-${String(tx.id).slice(-6).toUpperCase()}`}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">
              {new Date(tx.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
          {tx.type}
        </span>
      </td>
      <td className={`px-8 py-6 text-right font-black text-xl tracking-tighter ${isDeposit ? "text-cyan-400" : "text-slate-200"}`}>
        {isDeposit ? "+" : "-"}{tx.amount.toLocaleString()} 
        <span className="text-[10px] ml-1.5 opacity-40">đ</span>
      </td>
      <td className="px-8 py-6">
        <div className="text-xs font-bold text-slate-400 tracking-tight">
          {tx.balanceAfter.toLocaleString()} <span className="text-[10px] opacity-40">đ</span>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest shadow-inner">
           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
           Thành công
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shadow-inner">
        <History size={40} />
      </div>
      <div className="space-y-1">
        <p className="text-slate-300 font-black uppercase tracking-widest text-sm">Chưa có giao dịch</p>
        <p className="text-slate-500 text-[11px] font-medium max-w-[200px]">Mọi hoạt động tài chính của bạn sẽ xuất hiện tại đây.</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0c10] gap-8">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-white/5 rounded-full" />
        <div className="absolute inset-0 w-24 h-24 border-t-2 border-pink-500 rounded-full animate-spin shadow-[0_0_30px_rgba(236,72,153,0.3)]" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-white font-black uppercase tracking-[0.5em] text-xs">Fuji Ecosystem</p>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] animate-pulse">Securing your wallet data...</p>
      </div>
    </div>
  );
}