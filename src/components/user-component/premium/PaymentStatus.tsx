"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock,
  Copy,
  RefreshCw,
  X,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { useGetPaymentStatusQuery } from "@/store/services/paymentApi";
import { Button } from "@/components/ui/button";
import { usePaymentSocket } from "@/providers/PaymentSocketProvider";
import { store } from "@/store";
import { baseApi } from "@/store/services/baseApi";

interface PaymentStatusProps {
  orderId: string;
  amount: number;
  transferAmountVnd?: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  onClose: () => void;
}

export default function PaymentStatus({
  orderId,
  amount,
  transferAmountVnd,
  bankId,
  accountNo,
  accountName,
  onClose,
}: PaymentStatusProps) {
  const router = useRouter();
  const MAX_POLL_TIME = 300000; // 5 phút
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [socketHandled, setSocketHandled] = useState(false);

  const { refetch, isLoading: isStatusLoading } =
    useGetPaymentStatusQuery(orderId);

  const [isConfirming, setIsConfirming] = useState(false);

  const invalidateWalletAndPayment = () => {
    store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment"]));
  };

  // ── Socket.IO realtime: payment-status-change ─────────────────────
  const { isConnected, onPaymentStatusChange } = usePaymentSocket();

  useEffect(() => {
    const unsubStatus = onPaymentStatusChange((data) => {
      if (data.orderId === orderId) {
        if (data.newStatus === "SUCCESS") {
          invalidateWalletAndPayment();
          setSocketHandled(true);
          setTimeout(() => router.push("/premium/success"), 1000);
        } else if (data.newStatus === "FAILED") {
          invalidateWalletAndPayment();
          setSocketHandled(true);
          onClose();
        }
      }
    });

    return () => {
      unsubStatus();
    };
  }, [orderId, onPaymentStatusChange, router, onClose]);

  // 1. Đếm ngược từng giây
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const nextValue = prev + 1000;
        if (nextValue >= MAX_POLL_TIME) {
          clearInterval(timer);
          toast.error(
            "Giao dịch timeout. Nếu bạn đã chuyển khoản, hệ thống sẽ tự đối soát.",
            { duration: 5000 },
          );
          onClose();
        }
        return nextValue;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  // 2. Fallback Check: Nếu trong vòng 30s không nhận được event từ Socket, fetch thủ công check trạng thái đúng 1 lần
  useEffect(() => {
    if (socketHandled) return;

    const timeoutId = setTimeout(async () => {
      try {
        const result = await refetch();
        if (result.data?.status === "SUCCESS") {
          invalidateWalletAndPayment();
          setSocketHandled(true);
          toast.success("Thanh toán thành công!");
          setTimeout(() => router.push("/premium/success"), 1000);
        } else if (result.data?.status === "FAILED") {
          invalidateWalletAndPayment();
          setSocketHandled(true);
          toast.error("Thanh toán thất bại.");
          onClose();
        } else {
           // Giao dịch có thể thật sự bị delay từ Ngân hàng / XGate
           toast.info("Hệ thống ngân hàng đang xử lý, sẽ mất thêm chút thời gian...");
        }
      } catch (error) {
        console.error("Fallback check error:", error);
      }
    }, 20000); // Fallback 20s (đủ cho 1 chu kỳ polling 15s + margin)

    return () => clearTimeout(timeoutId);
  }, [refetch, onClose, router, socketHandled]);

  // 3. Xử lý nút Manual Check rate-limited (5s cooldown)
  const handleManualCheck = async () => {
    if (socketHandled || isManualChecking) return;
    const now = Date.now();
    if (now - lastCheckTime < 5000) {
      toast.info("Vui lòng đợi 5 giây giữa các lần kiểm tra.");
      return;
    }

    setIsManualChecking(true);
    setLastCheckTime(now);
    try {
      const result = await refetch();
      if (result.data?.status === "SUCCESS") {
        invalidateWalletAndPayment();
        setSocketHandled(true);
        toast.success("Thanh toán thành công!");
        setTimeout(() => router.push("/premium/success"), 1000);
      } else if (result.data?.status === "FAILED") {
        invalidateWalletAndPayment();
        setSocketHandled(true);
        toast.error("Thanh toán thất bại.");
        onClose();
      } else {
        toast.info("Giao dịch đang chờ xác nhận...", { duration: 2000 });
      }
    } catch {
      toast.error("Lỗi khi tải lại trạng thái!");
    } finally {
      setIsManualChecking(false);
    }
  };

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

  const qrAmountVnd = transferAmountVnd ?? amount * 1000;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${qrAmountVnd}&addInfo=${orderId}&accountName=${accountName}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0c10]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#12141c] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] max-w-4xl w-full overflow-hidden relative">
        {/* --- OVERLAY XÁC NHẬN HỦY: NẰM Ở ĐÂY ĐỂ RA GIỮA TOÀN BỘ MODAL --- */}
        {isConfirming && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1a1d29] border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full mx-4 shadow-2xl text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                  Xác nhận hủy?
                </h4>
                <p className="text-slate-400 text-sm font-medium px-4">
                  Giao dịch sẽ bị dừng lại và mã QR này sẽ không còn hiệu lực.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={onClose}
                  className="h-14 rounded-2xl bg-pink-400 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                >
                  Đồng ý hủy
                </Button>
                <button
                  onClick={() => setIsConfirming(false)}
                  className="h-12 text-slate-500 hover:text-white font-bold text-xs uppercase transition-colors"
                >
                  Quay lại thanh toán
                </button>
              </div>
            </div>
          </div>
        )}

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
              <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-[2rem] dashed-path animate-pulse" />
              <div className="relative bg-white p-4 rounded-3xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <Image
                  src={qrUrl}
                  alt="QR Code"
                  width={300}
                  height={300}
                  className="rounded-xl"
                  priority
                />
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan opacity-70" />
              </div>
            </div>
            <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-[#12141c] flex items-center justify-center text-[10px] font-bold">
                  V
                </div>
                <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-[#12141c] flex items-center justify-center text-[10px] font-bold">
                  N
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Hỗ trợ mọi ngân hàng & Napas247
              </p>
            </div>
            {/* Manual Check Link */}
            <div className="mt-5 text-center">
              <button
                onClick={handleManualCheck}
                disabled={isManualChecking || isStatusLoading}
                className={`text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 mx-auto ${
                  isManualChecking || isStatusLoading
                    ? "text-slate-500 cursor-not-allowed opacity-50"
                    : "text-pink-400 hover:text-pink-300 underline decoration-pink-500/30 underline-offset-4"
                }`}
              >
                {(isManualChecking || isStatusLoading) && (
                  <RefreshCw size={12} className="animate-spin-slow" />
                )}
                Không tự động cập nhật? Kiểm tra trực tiếp
              </button>
            </div>
          </div>

          {/* RIGHT: Payment Info & Status */}
          <div className="p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Banknote className="text-indigo-400" /> Thanh toán
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Thực hiện chuyển khoản theo thông tin bên dưới
                </p>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Ngân hàng"
                  value={bankId}
                  onCopy={() => copyToClipboard(bankId, "ngân hàng")}
                />
                <InfoRow
                  label="Số tài khoản"
                  value={accountNo}
                  onCopy={() => copyToClipboard(accountNo, "số tài khoản")}
                  isBold
                />
                <InfoRow label="Chủ tài khoản" value={accountName} />
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">
                      Số hoa cần nạp
                    </p>
                    <p className="text-2xl font-black text-white">
                      {amount.toLocaleString("vi-VN")} 🌸
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Chuyển khoản: {qrAmountVnd.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="p-2 bg-pink-500 rounded-xl">
                    <ShieldCheck className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase text-pink-500 tracking-[0.2em] mb-2">
                    Nội dung bắt buộc
                  </p>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-2xl font-black text-white tracking-widest">
                      {orderId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(orderId, "nội dung")}
                      className="p-2 hover:bg-yellow-500/20 rounded-lg text-pink-500 transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <AlertCircle size={40} className="text-pink-500" />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-400">
                  <RefreshCw size={16} className="animate-spin-slow" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Đang chờ...
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                  <Clock size={14} />
                  {formatTimeLeft(MAX_POLL_TIME - elapsedTime)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => setIsConfirming(true)}
                  variant="ghost"
                  className="h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 font-bold text-xs uppercase text-slate-400 hover:text-pink-400 transition-all"
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
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
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

function InfoRow({
  label,
  value,
  onCopy,
  isBold,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  isBold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm ${isBold ? "font-black text-white" : "font-medium text-slate-300"}`}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-slate-600 hover:text-indigo-400 transition-colors"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
