"use client";

import { useState, useEffect } from "react";
import { useGetWalletHistoryQuery } from "@/store/services/walletApi";
import { Transaction } from "@/types/wallet";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  ArrowLeft,
  Download,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function TransactionHistory() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>("ALL"); // ALL, DEPOSIT, WITHDRAW
  const size = 10;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useGetWalletHistoryQuery({ page, size });

  const transactions = data?.content || [];
  const totalPages = data?.totalPages || 0;

  // Lọc dữ liệu client-side (Nếu API chưa hỗ trợ lọc)
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.type === filter;
  });

  if (!mounted) return null;

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#050508]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(236,72,153,0.3)]"></div>
        <p className="mt-4 text-pink-500/50 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Đang tải dữ liệu...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 pb-20 selection:bg-pink-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl lg:pl-16 px-4 md:px-8 pt-8 space-y-8">
        
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 hover:text-pink-400 transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl bg-white/5 group-hover:bg-pink-500/10 border border-white/10 group-hover:border-pink-500/20 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">Quay lại</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-cyan-500/5 border border-cyan-500/20 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
               <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Hệ thống bảo mật</span>
            </div>
          </div>
        </div>

        {/* Header & Filter Controls */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">Lịch sử</span>
              <History size={32} className="text-pink-500" />
            </h1>
            <p className="text-slate-500 font-medium max-w-md text-sm border-l-2 border-pink-500/30 pl-4">
              Quản lý dòng tiền của bạn với bộ nhận diện thông minh Xanh-Hồng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              {[
                { label: "Tất cả", value: "ALL" },
                { label: "Nạp tiền", value: "DEPOSIT" },
                { label: "Thanh toán", value: "WITHDRAW" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === item.value 
                    ? "bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg shadow-pink-500/20" 
                    : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Tìm giao dịch..."
                className="pl-12 pr-6 h-14 rounded-2xl bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none w-full md:w-64 transition-all text-xs font-bold uppercase tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* Table Dashboard */}
        <div className="bg-[#0c0c14] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-500/5 to-pink-500/5 border-b border-white/5">
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">ID Giao dịch</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-pink-400/70 text-center">Phân loại</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 text-right">Giá trị</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-pink-400/70">Biến động</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">Ngày giờ</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-pink-400/70 text-right">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx: Transaction) => {
                  const isDeposit = tx.type === "DEPOSIT" || tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-all group border-l-2 border-transparent hover:border-pink-500">
                      <td className="p-6">
                        <span className="font-mono text-[11px] text-cyan-400/80 tracking-tighter">
                          #{tx.referenceId || String(tx.id).substring(0, 8).toUpperCase()}
                        </span>
                      </td>

                      <td className="p-6 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          isDeposit 
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                          : "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                        }`}>
                          {isDeposit ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {tx.type}
                        </span>
                      </td>

                      <td className={`p-6 text-right font-black text-xl tracking-tighter ${isDeposit ? "text-cyan-400" : "text-pink-500"}`}>
                        {isDeposit ? "+" : "-"}{tx.amount.toLocaleString()} 
                        <span className="text-[10px] ml-1 opacity-40">đ</span>
                      </td>

                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-white text-sm">{tx.balanceAfter.toLocaleString()} đ</span>
                          <span className="text-[9px] text-slate-600 font-bold uppercase">Sau giao dịch</span>
                        </div>
                      </td>

                      <td className="p-6 text-slate-400 text-xs font-bold tracking-tighter">
                        {new Date(tx.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="p-6 text-right">
                        <span className="inline-flex items-center gap-1.5 text-cyan-400/50 font-black text-[9px] uppercase tracking-widest">
                           <CheckCircle2 size={12} /> Thành công
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-[0.2em]">
               <Download size={14} /> Tải báo cáo tháng
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 disabled:opacity-10 hover:border-pink-500/50 hover:text-pink-500 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex gap-2">
               <span className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-white/10 font-black text-white text-xs">
                 {page + 1} / {totalPages}
               </span>
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 disabled:opacity-10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}