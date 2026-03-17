"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Home, CreditCard, Sparkles, PartyPopper } from "lucide-react";
import { useGetWalletQuery } from "@/store/services/walletApi";

export default function PaymentSuccessPage() {
  const { data: wallet } = useGetWalletQuery();
  const [countdown, setCountdown] = useState(10);

  // Đếm ngược và tự động chuyển hướng
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirect = setTimeout(() => {
      window.location.href = "/user/premium";
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, []);

  const balance = wallet?.balance || 0;
  const flowers = Math.floor(balance / 1000);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor - Hiệu ứng ánh sáng rực rỡ hơn cho chiến thắng */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl w-full">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* CỘT TRÁI: HIỆU ỨNG THÀNH CÔNG (Chiếm 5/12) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent p-12 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-white/5">
              <div className="relative mb-8">
                {/* Lớp vòng tròn tỏa sáng */}
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-ping" />
                <div className="relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full p-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <Check className="w-16 h-16 text-white" strokeWidth={4} />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-xl rotate-12 shadow-lg">
                  <PartyPopper className="w-5 h-5 text-slate-900" />
                </div>
              </div>

              <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">
                Thành công!
              </h1>
              <p className="text-slate-400 font-medium leading-relaxed">
                Giao dịch của bạn đã được xác nhận. <br />
                Tài khoản đã sẵn sàng để sử dụng.
              </p>

              {/* Progress Bar đếm ngược */}
              <div className="mt-10 w-full max-w-[200px] space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Chuyển hướng sau {countdown}s
                </p>
              </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT GIAO DỊCH (Chiếm 7/12) */}
            <div className="lg:col-span-7 p-12 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hóa đơn điện tử</p>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Chi tiết tài khoản</h2>
                </div>
                <Sparkles className="text-emerald-400" size={24} />
              </div>

              {/* Wallet Card - Hiển thị số dư phong cách hiện đại */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CreditCard size={100} />
                </div>
                
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Số dư hiện tại</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {flowers}
                  </span>
                  <span className="text-4xl mb-2 animate-bounce">🌸</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-slate-400 font-mono italic">
                  <span>≈ {balance.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              {/* Chi tiết biên lai */}
              <div className="grid grid-cols-2 gap-6 pt-4 text-sm font-medium">
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-1">Thời gian</p>
                    <p className="text-slate-200">{new Date().toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-1">Mã giao dịch</p>
                    <p className="text-slate-200 font-mono tracking-tighter">#TXN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-1">Trạng thái</p>
                    <div className="flex items-center gap-2 text-emerald-400 uppercase font-black text-[10px] tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Hoàn thành
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-1">Loại ví</p>
                    <p className="text-slate-200">Ví Premium</p>
                  </div>
                </div>
              </div>

              {/* Nút hành động bố cục ngang */}
              <div className="grid grid-cols-2 gap-4 pt-8">
                <Link
                  href="/premium"
                  className="flex items-center justify-center gap-2 px-6 h-14 bg-white text-slate-900 font-black rounded-2xl hover:bg-emerald-400 transition-all group uppercase text-xs tracking-widest"
                >
                  Mua thêm hoa <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 h-14 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase text-xs tracking-widest"
                >
                  <Home className="w-4 h-4" /> Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
          Cảm ơn bạn đã tin tưởng hệ thống của chúng tôi
        </p>
      </div>
    </div>
  );
}