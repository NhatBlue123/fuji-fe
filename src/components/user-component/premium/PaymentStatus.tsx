"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { tMsg } from "@/i18n";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  PartyPopper,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
  amount?: number;
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
const PINK_PRIMARY_BUTTON_CLASS =
  "bg-pink-500 text-white shadow-lg shadow-pink-500/25 transition-all hover:bg-pink-600 hover:shadow-pink-500/35";
const MUTED_SECONDARY_BUTTON_CLASS =
  "border border-white/10 bg-white/[0.04] text-slate-400 shadow-none transition-all hover:bg-white/[0.08] hover:text-slate-200";

const toFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const playPaymentSuccessSound = () => {
  if (typeof window === "undefined") return;

  const AudioContextConstructor =
    window.AudioContext ||
    (window as WindowWithWebkitAudioContext).webkitAudioContext;

  if (!AudioContextConstructor) return;

  try {
    const audioContext = new AudioContextConstructor();
    const startTime = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = startTime + index * 0.09;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.24);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.26);
    });

    void audioContext.resume().catch(() => undefined);
    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, 900);
  } catch {
    // Browsers may block non-gesture audio; the visual success state still applies.
  }
};

export default function PaymentStatus({
  orderId,
  amount,
  transferAmountVnd,
  bankId,
  accountNo,
  accountName,
  onClose,
}: PaymentStatusProps) {
  const { t, i18n } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [resolvedBy, setResolvedBy] = useState<"socket" | "poll" | null>(null);
  const [pollingUntil, setPollingUntil] = useState<number | null>(null);
  const handledRef = useRef(false);
  const successCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [getPaymentStatus, { isFetching: isStatusLoading }] =
    useLazyGetPaymentStatusQuery();

  const { isConnected, onPaymentStatusChange } = usePaymentSocket();

  const invalidateWalletAndPayment = useCallback(() => {
    store.dispatch(baseApi.util.invalidateTags(["Wallet", "Payment"]));
  }, []);

  const closeSuccessPopup = useCallback(() => {
    if (successCloseTimerRef.current) {
      clearTimeout(successCloseTimerRef.current);
      successCloseTimerRef.current = null;
    }

    setIsSuccessPopupOpen(false);
    onClose();
  }, [onClose]);

  const requestClosePayment = useCallback(() => {
    setIsConfirming(true);
  }, []);

  const finalizeSuccess = useCallback(
    (source: "socket" | "poll") => {
      handledRef.current = true;
      setResolvedBy(source);
      setPollingUntil(null);
      invalidateWalletAndPayment();
      setIsSuccessPopupOpen(true);
      playPaymentSuccessSound();

      if (successCloseTimerRef.current) {
        clearTimeout(successCloseTimerRef.current);
      }

      successCloseTimerRef.current = setTimeout(closeSuccessPopup, 5000);
    },
    [closeSuccessPopup, invalidateWalletAndPayment],
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

      if (status === "FAILED" || status === "CANCELLED") {
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
        handleStatusResult(result.data?.status, source, result.data?.message);
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
          if (!handledRef.current) {
            toast.error(tMsg("payment.timeoutError"), { duration: 5000 });
            onClose();
          }
        }
        return nextValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (successCloseTimerRef.current) {
        clearTimeout(successCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubStatus = onPaymentStatusChange((data: PaymentStatusChangeEvent) => {
      if (handledRef.current) return;
      if (data.transactionType !== "TOPUP" || data.orderId !== orderId) return;

      handleStatusResult(data.newStatus, "socket", data.message);
    });

    return () => unsubStatus();
  }, [handleStatusResult, onPaymentStatusChange, orderId]);

  // CHỈ polling khi socket KHÔNG kết nối được (fallback mode)
  // VÀ chỉ trong khoảng thời gian giới hạn (18 giây)
  useEffect(() => {
    if (handledRef.current) return;

    // Nếu socket đang hoạt động tốt, KHÔNG cần polling
    if (isConnected) {
      setPollingUntil(null);
      return;
    }

    // Socket không hoạt động -> bật fallback polling
    const deadline = Date.now() + FALLBACK_POLL_WINDOW_MS;
    setPollingUntil(deadline);
    void pollStatus("poll");
  }, [isConnected, orderId, pollStatus]);

  // Effect này chỉ chạy khi pollingUntil được set (tức là socket fail)
  useEffect(() => {
    if (handledRef.current || !pollingUntil) return;

    // Hết thời gian polling
    if (Date.now() >= pollingUntil) {
      setPollingUntil(null);
      return;
    }

    // Polling interval - CHỈ chạy khi pollingUntil còn giá trị
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
      handleStatusResult(result.data?.status, "poll", result.data?.message);
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

  const displayAmount = toFiniteNumber(amount, 0);
  const qrAmountVnd = toFiniteNumber(transferAmountVnd, displayAmount * 1000);
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${qrAmountVnd}&addInfo=${encodeURIComponent(orderId)}&accountName=${encodeURIComponent(accountName)}`;

  if (isSuccessPopupOpen) {
    return (
      <PaymentSuccessPopup
        amount={displayAmount}
        transferAmountVnd={qrAmountVnd}
        onClose={closeSuccessPopup}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onMouseDown={requestClosePayment}
    >
      <div
        className="bg-[#12141c] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] max-w-4xl w-full overflow-hidden relative"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {isConfirming && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/55 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1a1d29] border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full mx-4 shadow-2xl text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                  {t("payment.confirmCancelTitle")}
                </h4>
                <p className="text-slate-300 text-sm font-medium px-4 leading-6">
                  {t("payment.confirmCancelDesc")}
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={onClose}
                  className={`h-14 rounded-full font-semibold uppercase text-xs tracking-widest ${MUTED_SECONDARY_BUTTON_CLASS}`}
                >
                  {t("payment.agreeCancel")}
                </Button>
                <button
                  onClick={() => setIsConfirming(false)}
                  className={`h-12 rounded-full font-semibold text-xs uppercase tracking-widest ${PINK_PRIMARY_BUTTON_CLASS}`}
                >
                  {t("payment.backToPayment")}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={requestClosePayment}
          className="absolute top-6 right-6 p-2 rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-all hover:bg-pink-600 hover:shadow-pink-500/35 z-10"
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
                <InfoRow label={t("payment.accountHolder")} value={accountName} />
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">
                      {t("payment.amountNeeded")}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {displayAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')} 🌸
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("payment.actualTransferAmount")}: {qrAmountVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')}đ
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
                  onClick={requestClosePayment}
                  variant="ghost"
                  className={`h-12 rounded-full font-semibold text-xs uppercase tracking-widest ${PINK_PRIMARY_BUTTON_CLASS}`}
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

function PaymentSuccessPopup({
  amount,
  transferAmountVnd,
  onClose,
}: {
  amount: number;
  transferAmountVnd: number;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale =
    i18n.language === "vi"
      ? "vi-VN"
      : i18n.language === "ja"
        ? "ja-JP"
        : "en-US";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-emerald-950/45 p-4 backdrop-blur-md payment-success-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="payment-success-card relative w-full max-w-[460px] overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[#10141d] shadow-[0_32px_90px_-24px_rgba(16,185,129,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.24),transparent_42%)]" />
        <div className="payment-success-sparks pointer-events-none absolute inset-0">
          <span className="payment-success-spark payment-success-spark-1" />
          <span className="payment-success-spark payment-success-spark-2" />
          <span className="payment-success-spark payment-success-spark-3" />
          <span className="payment-success-spark payment-success-spark-4" />
          <span className="payment-success-spark payment-success-spark-5" />
          <span className="payment-success-spark payment-success-spark-6" />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 z-10 rounded-full bg-pink-500 p-2 text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-600 hover:shadow-pink-500/35"
        >
          <X size={18} />
        </button>

        <div className="relative px-7 py-8 text-center sm:px-9">
          <div className="relative mx-auto mb-6 h-28 w-28">
            <div className="payment-success-ping absolute inset-0 rounded-full bg-emerald-400/25" />
            <div className="payment-success-pulse absolute inset-4 rounded-full bg-cyan-300/15" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 via-teal-400 to-cyan-500 shadow-[0_0_44px_rgba(45,212,191,0.35)]">
              <CheckCircle2 className="h-14 w-14 text-[#06100d]" strokeWidth={2.8} />
            </div>
            <div className="payment-success-pop absolute -right-2 -top-1 rounded-2xl bg-yellow-300 p-2.5 text-slate-950 shadow-lg shadow-yellow-300/20">
              <PartyPopper size={20} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              <Sparkles size={13} />
              {t("payment.successPopupKicker")}
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tight text-white">
              {t("payment.successPopupTitle")}
            </h3>
            <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-slate-300">
              {t("payment.successPopupDesc")}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t("payment.successPopupFlowers")}
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {amount.toLocaleString(locale)} 🌸
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t("payment.successPopupVnd")}
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {transferAmountVnd.toLocaleString(locale)}đ
              </p>
            </div>
          </div>

          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="payment-success-countdown h-full rounded-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300" />
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {t("payment.successPopupAutoClose")}
          </p>

          <Button
            onClick={onClose}
            className={`mt-6 h-12 w-full rounded-full font-semibold uppercase tracking-widest ${PINK_PRIMARY_BUTTON_CLASS}`}
          >
            {t("payment.successPopupClose")}
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .payment-success-backdrop {
          animation: payment-success-fade 220ms ease-out both;
        }
        .payment-success-card {
          animation: payment-success-rise 420ms cubic-bezier(0.18, 0.9, 0.28, 1.08) both;
        }
        .payment-success-ping {
          animation: payment-success-ping 1.8s ease-out infinite;
        }
        .payment-success-pulse {
          animation: payment-success-pulse 1.7s ease-in-out infinite;
        }
        .payment-success-pop {
          animation: payment-success-pop 520ms cubic-bezier(0.18, 0.9, 0.28, 1.12) 120ms both;
        }
        .payment-success-countdown {
          animation: payment-success-countdown 5s linear forwards;
        }
        .payment-success-spark {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #facc15;
          opacity: 0;
          animation: payment-success-spark 1.65s ease-out infinite;
        }
        .payment-success-spark-1 {
          left: 18%;
          top: 22%;
          background: #34d399;
          animation-delay: 80ms;
        }
        .payment-success-spark-2 {
          right: 19%;
          top: 18%;
          background: #67e8f9;
          animation-delay: 230ms;
        }
        .payment-success-spark-3 {
          left: 12%;
          top: 58%;
          background: #fde68a;
          animation-delay: 360ms;
        }
        .payment-success-spark-4 {
          right: 13%;
          top: 55%;
          background: #5eead4;
          animation-delay: 510ms;
        }
        .payment-success-spark-5 {
          left: 31%;
          top: 12%;
          background: #a7f3d0;
          animation-delay: 650ms;
        }
        .payment-success-spark-6 {
          right: 32%;
          top: 72%;
          background: #fef08a;
          animation-delay: 780ms;
        }
        @keyframes payment-success-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes payment-success-rise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes payment-success-ping {
          0% {
            opacity: 0.45;
            transform: scale(0.82);
          }
          80%,
          100% {
            opacity: 0;
            transform: scale(1.32);
          }
        }
        @keyframes payment-success-pulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(0.92);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
        @keyframes payment-success-pop {
          from {
            opacity: 0;
            transform: translateY(8px) rotate(-10deg) scale(0.72);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotate(10deg) scale(1);
          }
        }
        @keyframes payment-success-countdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes payment-success-spark {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.4);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-24px) scale(1.2);
          }
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
