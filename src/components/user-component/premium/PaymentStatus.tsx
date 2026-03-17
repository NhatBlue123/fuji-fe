"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Clock, Copy, RefreshCw, X, ShieldCheck, Banknote } from "lucide-react";
import { useGetPaymentStatusQuery } from "@/store/services/paymentApi";
import { Button } from "@/components/ui/button";

interface PaymentStatusProps {
  orderId: string;
  amount: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  onClose: () => void;
}

export default function PaymentStatus({
  orderId,
  amount,
  bankId,
  accountNo,
  accountName,
  onClose,
}: PaymentStatusProps) {
  const router = useRouter();
  const [pollCount, setPollCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_POLL_TIME = 300000; // 10 phút
  const POLL_INTERVAL = 20000; // 20 giây

  const { data: paymentStatus, refetch, isLoading: isStatusLoading } = useGetPaymentStatusQuery(orderId, {
    skipPolling: true,
  });

  useEffect(() => {
    let elapsedMs = 0;
    const interval = setInterval(async () => {
      elapsedMs += POLL_INTERVAL;
      setElapsedTime(elapsedMs);
      setPollCount((prev) => prev + 1);

      try {
        const result = await refetch();
        if (result.data?.status === "SUCCESS") {
          toast.success("Thanh toán thành công!");
          clearInterval(interval);
          setTimeout(() => router.push("/premium/success"), 1000);
        } else if (result.data?.status === "FAILED") {
          toast.error("Thanh toán thất bại.");
          clearInterval(interval);
          onClose();
        } else if (elapsedMs >= MAX_POLL_TIME) {
          toast.error("Hết thời gian chờ giao dịch.");
          clearInterval(interval);
          onClose();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId, refetch, onClose, router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${orderId}&accountName=${accountName}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0c10]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#12141c] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] max-w-4xl w-full overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* LEFT: QR Code Visual */}
          <div className="p-10 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
            <div className="relative group">
              {/* QR Frame Decor */}
              <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-[2rem] dashed-path animate-pulse" />
              
              <div className="relative bg-white p-4 rounded-3xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <Image src={qrUrl} alt="QR Code" width={300} height={300} className="rounded-xl" priority />
                
                {/* QR Scanner Line Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan opacity-70" />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex -space-x-2">
                 <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-[#12141c] flex items-center justify-center text-[10px] font-bold">V</div>
                 <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-[#12141c] flex items-center justify-center text-[10px] font-bold">N</div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hỗ trợ mọi ngân hàng & Napas247</p>
            </div>
          </div>

          {/* RIGHT: Payment Info & Status */}
          <div className="p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                   <Banknote className="text-indigo-400" /> Thanh toán
                </h3>
                <p className="text-slate-500 text-sm mt-1">Vui lòng thực hiện chuyển khoản theo thông tin dưới đây</p>
              </div>

              {/* Thông tin chi tiết */}
              <div className="space-y-3">
                <InfoRow label="Ngân hàng" value={bankId} onCopy={() => copyToClipboard(bankId, "ngân hàng")} />
                <InfoRow label="Số tài khoản" value={accountNo} onCopy={() => copyToClipboard(accountNo, "số tài khoản")} isBold />
                <InfoRow label="Chủ tài khoản" value={accountName} />
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Số tiền cần nạp</p>
                    <p className="text-2xl font-black text-white">{amount.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="p-2 bg-indigo-500 rounded-xl">
                    <ShieldCheck className="text-white" size={24} />
                  </div>
                </div>
              </div>

              {/* Nội dung chuyển khoản - Quan trọng nhất */}
              <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em] mb-2">Nội dung bắt buộc</p>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-2xl font-black text-white tracking-widest">{orderId}</span>
                    <button 
                      onClick={() => copyToClipboard(orderId, "nội dung")}
                      className="p-2 hover:bg-yellow-500/20 rounded-lg text-yellow-500 transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <AlertCircle size={40} className="text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Polling Footer */}
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <RefreshCw size={16} className="animate-spin-slow" />
                  <span className="text-xs font-bold uppercase tracking-widest">Đang chờ xác nhận...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                  <Clock size={14} />
                  {formatTimeLeft(MAX_POLL_TIME - elapsedTime)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => refetch()}
                  disabled={isStatusLoading}
                  className="h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs uppercase"
                >
                  {isStatusLoading ? "Đang check..." : "Kiểm tra ngay"}
                </Button>
                <Button 
                  onClick={onClose}
                  variant="ghost"
                  className="h-12 rounded-xl text-slate-500 hover:text-red-400 font-bold text-xs uppercase"
                >
                  Hủy giao dịch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value, onCopy, isBold }: { label: string, value: string, onCopy?: () => void, isBold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isBold ? "font-black text-white" : "font-medium text-slate-300"}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-slate-600 hover:text-indigo-400 transition-colors">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}