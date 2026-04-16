"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tMsg } from "@/i18n";
import {
  AlertCircle,
  Banknote,
  Clock,
  Copy,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type PaymentStatusResponse,
  useLazyGetPaymentStatusQuery,
} from "@/store/services/paymentApi";
import { type PaymentStatusChangeEvent, usePaymentSocket } from "@/providers/PaymentSocketProvider";
import { store } from "@/store";
import { baseApi } from "@/store/services/baseApi";
import { useTranslation } from "react-i18next";

interface PaymentStatusProps {
  orderId: string;
  amount: number;
  transferAmountVnd?: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  createdAt: number;
  onClose: () => void;
}

const MAX_WAIT_TIME_MS = 300000;
const FALLBACK_POLL_INTERVAL_MS = 3000;
const FALLBACK_POLL_WINDOW_MS = 18000;

export default function PaymentStatus({
  orderId,
  amount,
  transferAmountVnd,
  bankId,
  accountNo,
  accountName,
  createdAt,
  onClose,
}: PaymentStatusProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [resolvedBy, setResolvedBy] = useState<"socket" | "poll" | null>(null);
  const [pollingUntil, setPollingUntil] = useState<number | null>(null);
  const handledRef = useRef(false);

  const [getPaymentStatus, { isFetching: isStatusLoading }] =
    useLazyGetPaymentStatusQuery();

  const { isConnected, onPaymentStatusChange } = usePaymentSocket();

  const invalidateWalletAndPayment = useCallback(() => {
    store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment"]));
  }, []);

  const finalizeSuccess = useCallback(
    (source: "socket" | "poll") => {
      handledRef.current = true;
      setResolvedBy(source);
      setPollingUntil(null);
      invalidateWalletAndPayment();
      if (source === "poll") {
        toast.success(tMsg("payment.status.success"));
      }
      setTimeout(() => router.push("/premium/success"), 1000);
    },
    [invalidateWalletAndPayment, router],
  );

  const finalizeFailure = useCallback(
    (source: "socket" | "poll", messageKey?: string) => {
      handledRef.current = true;
      setResolvedBy(source);
      setPollingUntil(null);
      invalidateWalletAndPayment();
      if (source === "poll") {
        toast.error(tMsg(messageKey) || tMsg("payment.status.failed"));
      }
      onClose();
    },
    [invalidateWalletAndPayment, onClose],
  );

  const handleStatusResult = useCallback(
    (
      status: PaymentStatusResponse["status"] | string | undefined,
      source: "socket" | "poll",
      messageKey?: string,
    ) => {
      if (!status || handledRef.current) return;

      if (status === "SUCCESS") {
        finalizeSuccess(source);
        return;
      }

      if (status === "FAILED") {
        finalizeFailure(source, messageKey);
      }
    },
    [finalizeFailure, finalizeSuccess],
  );

  const pollStatus = useCallback(
    async (source: "poll") => {
      if (handledRef.current) return;

      try {
        const result = await getPaymentStatus(orderId, true);
        handleStatusResult(result.data?.status, source, result.data?.messageKey);
      } catch (error) {
        console.error("[payment] status poll failed", { orderId, error });
      }
    },
    [getPaymentStatus, handleStatusResult, orderId],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const nextValue = prev + 1000;
        if (nextValue >= MAX_WAIT_TIME_MS) {
          clearInterval(timer);
          toast.error(tMsg("payment.timeoutError"), { duration: 5000 });
          onClose();
        }
        return nextValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  useEffect(() => {
    const unsubStatus = onPaymentStatusChange((data: PaymentStatusChangeEvent) => {
      if (handledRef.current) return;
      if (data.transactionType !== "TOPUP" || data.orderId !== orderId) return;

      handleStatusResult(data.newStatus, "socket", data.message);
    });

    return () => unsubStatus();
  }, [handleStatusResult, onPaymentStatusChange, orderId]);

  useEffect(() => {
    if (handledRef.current) return;

    if (!isConnected) {
      const deadline = Date.now() + FALLBACK_POLL_WINDOW_MS;
      setPollingUntil(deadline);
      void pollStatus("poll");
      return;
    }

    setPollingUntil(null);
  }, [isConnected, orderId, pollStatus]);

  useEffect(() => {
    if (handledRef.current || !pollingUntil) return;

    if (Date.now() >= pollingUntil) {
      setPollingUntil(null);
      return;
    }

    const intervalId = setInterval(() => {
      if (handledRef.current || Date.now() >= (pollingUntil || 0)) {
        clearInterval(intervalId);
        setPollingUntil(null);
        return;
      }
      void pollStatus("poll");
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [pollStatus, pollingUntil]);

  const handleManualCheck = async () => {
    if (handledRef.current || isManualChecking) return;

    const now = Date.now();
    if (now - lastCheckTime < 5000) {
      toast.info(t("payment.waitFiveSeconds"));
      return;
    }

    setIsManualChecking(true);
    setLastCheckTime(now);

    try {
      const result = await getPaymentStatus(orderId, true);
      handleStatusResult(result.data?.status, "poll", result.data?.messageKey);
    } catch {
      toast.error(tMsg("api.error"));
    } finally {
      setIsManualChecking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${tMsg("common.copied")} ${label}`);
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
        {isConfirming && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1a1d29] border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full mx-4 shadow-2xl text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                  {t("payment.confirmCancelTitle")}
                </h4>
                <p className="text-slate-400 text-sm font-medium px-4">
                  {t("payment.confirmCancelDesc")}
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={onClose}
                  className="h-14 rounded-2xl bg-pink-400 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                >
                  {t("payment.agreeCancel")}
                </Button>
                <button
                  onClick={() => setIsConfirming(false)}
                  className="h-12 text-slate-500 hover:text-white font-bold text-xs uppercase transition-colors"
                >
                  {t("payment.backToPayment")}
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
          <div className="p-10 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
            <div className="relative group">
              <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-[2rem] animate-pulse" />
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
                {t("payment.allBanksSupport")}
              </p>
            </div>
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
                {t("payment.manualCheck")}
              </button>
            </div>
          </div>

          <div className="p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Banknote className="text-indigo-400" /> {t("payment.paymentTitle")}
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  {t("payment.payoutDesc")}
                </p>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label={t("payment.bank")}
                  value={bankId}
                  onCopy={() => copyToClipboard(bankId, t("payment.bank"))}
                />
                <InfoRow
                  label={t("wallet.table.id")}
                  value={accountNo}
                  onCopy={() => copyToClipboard(accountNo, t("wallet.table.id"))}
                  isBold
                />
                <InfoRow label={t("wallet.withdraw.accountHolder")} value={accountName} />
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">
                      {t("payment.amountNeeded")}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {amount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')} 🌸
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("wallet.withdraw.actualReceived")}: {qrAmountVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')}đ
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
                    {t("payment.requiredContent")}
                  </p>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-2xl font-black text-white tracking-widest">
                      {orderId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(orderId, t("payment.requiredContent"))}
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
                  <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                    {resolvedBy
                      ? t("payment.confirmedVia", { source: resolvedBy })
                      : isConnected
                        ? t("payment.waitingSocket")
                        : t("payment.socketFallback")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                  <Clock size={14} />
                  {formatTimeLeft(MAX_WAIT_TIME_MS - elapsedTime)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => setIsConfirming(true)}
                  variant="ghost"
                  className="h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 font-bold text-xs uppercase text-slate-400 hover:text-pink-400 transition-all"
                >
                  {t("payment.cancelTransaction")}
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
