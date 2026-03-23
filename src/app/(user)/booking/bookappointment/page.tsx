"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Bell, CreditCard, Landmark } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateBookingMutation, useGetBookingQuoteQuery } from "@/store/services/bookingApi";

function formatVnd(v: number) {
  return `${v.toLocaleString("vi-VN")}đ`;
}

function formatDate(v: string) {
  const d = new Date(v);
  return d.toLocaleDateString("vi-VN");
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeSlotId = Number(searchParams.get("timeSlotId"));
  const validId = Number.isFinite(timeSlotId) && timeSlotId > 0;

  const [method, setMethod] = useState("card");
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: quote, isLoading, isFetching } = useGetBookingQuoteQuery(
    { timeSlotId },
    { skip: !validId }
  );

  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();

  const canConfirm = useMemo(() => !!quote && quote.canPay, [quote]);

  const onConfirm = async () => {
    if (!validId) return;
    setErrorMsg("");
    try {
      await createBooking({ timeSlotId }).unwrap();
      setShowSuccess(true);
    } catch (e: any) {
      setErrorMsg(e?.data?.message || "Không thể xác nhận thanh toán.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-950 p-8 min-h-screen">
      {showSuccess && <SuccessModal router={router} />}

      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div
            onClick={() => router.back()}
            className="p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:bg-white/5 transition"
          >
            <ArrowLeft className="text-slate-100" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Thanh toán</h2>
        </div>


      </header>
        <div className="max-w-md mx-auto space-y-8"> 
          {/* 1. Phần tiêu đề  */}
          <div className="text-center"> 
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Xác nhận thanh toán</h1>
            <p className="text-slate-400">Kiểm tra thông tin đơn hàng trước khi đặt lịch.</p>
          </div>

          {!validId && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-300 text-center">
              Thiếu timeSlotId trên URL.
            </div>
          )}

          {(isLoading || isFetching) && (
            <div className="text-slate-400 text-center animate-pulse">
              Đang tải thông tin đơn hàng...
            </div>
          )}

          {/* 2. Phần khung tóm tắt đơn hàng */}
          {quote && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-6">
                {/* Ảnh minh họa */}
                <div 
                  className="aspect-video w-full rounded-xl bg-cover bg-center border border-slate-800" 
                  style={{ backgroundImage: 'url("https://picsum.photos/500/300")' }} 
                />

                {/* Thông tin môn học & Giáo viên */}
                <div>
                  <p className="text-pink-500 text-xs font-bold uppercase mb-1">Học phần: {quote.subject}</p>
                  <p className="text-slate-100 font-bold text-lg">GV. {quote.teacherName}</p>
                </div>

                {/* Thời gian */}
                <div className="space-y-3 text-sm text-slate-400 bg-white/5 p-3 rounded-lg">
                  <p className="flex items-center gap-2"><span>📅</span> {formatDate(quote.startAt)}</p>
                  <p className="flex items-center gap-2"><span>⏰</span> {formatTimeRange(quote.startAt, quote.endAt)} ({quote.durationMinutes} phút)</p>
                </div>

                {/* Chi tiết giá tiền */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Học phí</span>
                    <span>{quote.tuitionBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Phí dịch vụ</span>
                    <span>{quote.serviceFeeBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-2xl pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-pink-500">{quote.totalBlossom} 🌸</span>
                  </div>
                </div>

                {/* Thông báo lỗi nếu không đủ tiền */}
                {!quote.canPay && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {quote.message}
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorMsg}
                  </div>
                )}

                {/* Nút thanh toán */}
                <button
                  onClick={onConfirm}
                  disabled={!canConfirm || isCreating}
                  className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl shadow-lg shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  ) : (
                    "Xác nhận thanh toán"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
    </main>
  );
}

function PaymentOption({
  value,
  method,
  setMethod,
  title,
  desc,
  icon,
  label,
  color,
}: any) {
  return (
    <label className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-pink-500 transition">
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded-lg flex items-center justify-center text-white font-bold ${color}`}>
          {icon ? icon : label}
        </div>
        <div>
          <p className="font-medium text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>

      <input
        type="radio"
        name="payment"
        checked={method === value}
        onChange={() => setMethod(value)}
        className="w-5 h-5 accent-pink-500"
      />
    </label>
  );
}

function SuccessModal({ router }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-pink-500/30 rounded-xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="size-24 rounded-full border-4 border-pink-500 flex items-center justify-center text-pink-500 mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Thanh toán thành công!</h1>
        <p className="text-slate-300 mb-6">Bạn đã đặt lịch học thành công.</p>
        <button
          onClick={() => router.push("/booking/bookingmodal")}
          className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl"
        >
          Xem lịch của tôi
        </button>
      </div>
    </div>
  );
}
