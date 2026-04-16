"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateBookingMutation,
  useCreateBulkBookingMutation,
  useGetBookingQuoteQuery,
  useGetBulkBookingQuoteMutation,
} from "@/store/services/bookingApi";

type ApiErrorWithMessage = {
  data?: {
    message?: string;
  };
};

function extractApiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorWithMessage)?.data?.message || fallback;
}

function formatDate(v: string) {
  return new Date(v).toLocaleDateString("vi-VN");
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

export default function PaymentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeSlotId = Number(searchParams.get("timeSlotId"));
  const teacherId = Number(searchParams.get("teacherId"));
  const timeSlotIdsParam = searchParams.get("timeSlotIds") || "";

  const bulkIds = useMemo(
    () =>
      timeSlotIdsParam
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x) && x > 0),
    [timeSlotIdsParam],
  );

  const isSingleMode = Number.isFinite(timeSlotId) && timeSlotId > 0;
  const isBulkMode =
    Number.isFinite(teacherId) && teacherId > 0 && bulkIds.length > 0;

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data: singleQuote,
    isLoading,
    isFetching,
    isError: isSingleQuoteError,
    error: singleQuoteError,
  } = useGetBookingQuoteQuery({ timeSlotId }, { skip: !isSingleMode });

  const [
    getBulkQuote,
    {
      data: bulkQuote,
      isLoading: isBulkQuoteLoading,
      isError: isBulkQuoteError,
      error: bulkQuoteError,
    },
  ] = useGetBulkBookingQuoteMutation();

  useEffect(() => {
    if (!isBulkMode) return;
    getBulkQuote({ teacherId, timeSlotIds: bulkIds })
      .unwrap()
      .catch((e: unknown) => {
        setErrorMsg(
          extractApiErrorMessage(e, "Không tải được thông tin hóa đơn."),
        );
      });
  }, [isBulkMode, teacherId, bulkIds, getBulkQuote]);

  const [createBooking, { isLoading: isCreatingSingle }] =
    useCreateBookingMutation();
  const [createBulkBooking, { isLoading: isCreatingBulk }] =
    useCreateBulkBookingMutation();

  const isCreating = isCreatingSingle || isCreatingBulk;
  const quote = isSingleMode ? singleQuote : bulkQuote;
  const canConfirm = !!quote && quote.canPay;
  const isQuoteError = isSingleMode ? isSingleQuoteError : isBulkQuoteError;
  const quoteErrorMessage =
    extractApiErrorMessage(
      isSingleMode ? singleQuoteError : bulkQuoteError,
      "Không tải được thông tin hóa đơn.",
    ) || "Không tải được thông tin hóa đơn.";

  const onConfirm = async () => {
    setErrorMsg("");

    try {
      if (isSingleMode) {
        await createBooking({ timeSlotId }).unwrap();
      } else if (isBulkMode) {
        await createBulkBooking({
          teacherId,
          timeSlotIds: bulkIds,
        }).unwrap();
      } else {
        return;
      }

      setShowSuccess(true);
    } catch (e: unknown) {
      setErrorMsg(extractApiErrorMessage(e, "Không thể xác nhận thanh toán."));
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-950 p-8 min-h-screen">
      {showSuccess && <SuccessModal router={router} />}

      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 hover:text-pink-400 transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl bg-white/5 group-hover:bg-pink-500/10 border border-white/10 group-hover:border-pink-500/20 transition-all">
              <ArrowLeft size={18} />
            </div>
          </button>
          <h2 className="text-2xl font-bold text-slate-100">{t('auto.booking_appointment_1')}</h2>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Xác nhận thanh toán
          </h1>
          <p className="text-slate-400">
            Kiểm tra thông tin đơn hàng trước khi đặt lịch.
          </p>
        </div>

        {!isSingleMode && !isBulkMode && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
            Thiếu dữ liệu booking trên URL.
          </div>
        )}

        {(isLoading || isFetching || isBulkQuoteLoading) && (
          <div className="text-slate-400 text-center animate-pulse">
            Đang tải thông tin đơn hàng...
          </div>
        )}

        {isQuoteError && !quote && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
            {quoteErrorMessage}
          </div>
        )}

        {!isLoading &&
          !isFetching &&
          !isBulkQuoteLoading &&
          !isQuoteError &&
          !quote && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 text-center">
              Không có dữ liệu hóa đơn cho slot đã chọn. Vui lòng chọn lại lịch.
            </div>
          )}

        {quote && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">
              Tóm tắt đơn hàng
            </h3>

            {"items" in quote ? (
              <div className="space-y-6">
                <div>
                  <p className="text-slate-100 font-bold text-lg">
                    GV. {quote.teacherName}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {quote.slotCount} buổi đã chọn
                  </p>
                </div>

                <div className="space-y-3 max-h-80 overflow-auto">
                  {quote.items.map((item) => (
                    <div
                      key={item.timeSlotId}
                      className="rounded-xl border border-slate-800 bg-white/5 p-4"
                    >
                      <p className="text-pink-400 font-bold">{item.subject}</p>
                      <p className="text-slate-300 text-sm mt-1">
                        {formatDate(item.startAt)} |{" "}
                        {formatTimeRange(item.startAt, item.endAt)}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        {item.durationMinutes} phút
                      </p>
                      <p className="text-slate-100 text-sm mt-2">
                        {item.totalBlossom} 🌸
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>{t('auto.booking_appointment_2')}</span>
                    <span>{quote.tuitionBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>{t('auto.booking_appointment_3')}</span>
                    <span>{quote.serviceFeeBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-2xl pt-2">
                    <span>{t('auto.booking_appointment_4')}</span>
                    <span className="text-pink-500">
                      {quote.totalBlossom} 🌸
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-pink-500 text-xs font-bold uppercase mb-1">
                    Học phần: {quote.subject}
                  </p>
                  <p className="text-slate-100 font-bold text-lg">
                    GV. {quote.teacherName}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-slate-400 bg-white/5 p-3 rounded-lg">
                  <p>{formatDate(quote.startAt)}</p>
                  <p>
                    {formatTimeRange(quote.startAt, quote.endAt)} (
                    {quote.durationMinutes} phút)
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>{t('auto.booking_appointment_5')}</span>
                    <span>{quote.tuitionBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>{t('auto.booking_appointment_6')}</span>
                    <span>{quote.serviceFeeBlossom} 🌸</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-2xl pt-2">
                    <span>{t('auto.booking_appointment_7')}</span>
                    <span className="text-pink-500">
                      {quote.totalBlossom} 🌸
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!quote.canPay && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mt-6">
                {quote.message}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mt-4">
                {errorMsg}
              </div>
            )}

            <button
              onClick={onConfirm}
              disabled={!canConfirm || isCreating}
              className="w-full mt-6 py-4 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl shadow-lg shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isCreating ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function SuccessModal({
  router,
}: {
  router: { push: (path: string) => void };
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-pink-500/30 rounded-xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="size-24 rounded-full border-4 border-pink-500 flex items-center justify-center text-pink-500 mb-6">
          <Check className="h-12 w-12" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Thanh toán thành công!
        </h1>
        <p className="text-slate-300 mb-6">{t('auto.booking_appointment_8')}</p>
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
