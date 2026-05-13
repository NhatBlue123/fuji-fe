"use client";

export const dynamic = "force-dynamic";

import { useTranslation } from "react-i18next";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Check, Ticket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateBookingMutation,
  useCreateBulkBookingMutation,
  useGetBookingQuoteQuery,
  useGetBulkBookingQuoteMutation,
} from "@/store/services/bookingApi";
import {
  useGetMyCouponsQuery,
  type UserCoupon,
} from "@/store/services/userMonetizationApi";

type ApiErrorWithMessage = {
  data?: {
    messageKey?: string;
    message?: string;
  };
};

function extractApiErrorMessage(error: unknown, fallback: string) {
  const err = error as ApiErrorWithMessage;
  return err?.data?.messageKey || err?.data?.message || fallback;
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

function formatCouponDiscount(
  coupon: UserCoupon,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (coupon.discountType === "PERCENT") {
    return t("monetization.messages.discountPercent", {
      value: coupon.discountValue,
    });
  }
  return t("monetization.messages.discountBlossom", {
    value: Number(coupon.discountValue || 0).toLocaleString("vi-VN"),
  });
}

function formatCouponExpiry(
  coupon: UserCoupon,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!coupon.expiresAt) return t("monetization.messages.noExpiry");
  return t("monetization.messages.expiresOn", {
    date: new Date(coupon.expiresAt).toLocaleDateString("vi-VN"),
  });
}

function isActiveBookingCoupon(coupon: UserCoupon) {
  const scope = String(coupon.scope || "").toUpperCase();
  const status = String(coupon.status || "").toUpperCase();
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;
  return (
    status === "ACTIVE" &&
    (scope === "BOOKING" || scope === "BOTH") &&
    Number(coupon.usageRemaining ?? 0) > 0 &&
    (!expiresAt || expiresAt > Date.now())
  );
}

function PaymentPageContent() {
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const { data: myCoupons = [], isFetching: isFetchingCoupons } =
    useGetMyCouponsQuery(undefined, { skip: !isSingleMode && !isBulkMode });
  const bookingCoupons = useMemo(
    () => myCoupons.filter(isActiveBookingCoupon),
    [myCoupons],
  );

  const {
    data: singleQuote,
    isLoading,
    isFetching,
    isError: isSingleQuoteError,
    error: singleQuoteError,
  } = useGetBookingQuoteQuery(
    { timeSlotId, couponCode: appliedCouponCode || undefined },
    { skip: !isSingleMode },
  );

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
    getBulkQuote({
      teacherId,
      timeSlotIds: bulkIds,
      couponCode: appliedCouponCode || undefined,
    })
      .unwrap()
      .catch((e: unknown) => {
        setErrorMsg(
          extractApiErrorMessage(e, "Không tải được thông tin hóa đơn."),
        );
      });
  }, [isBulkMode, teacherId, bulkIds, appliedCouponCode, getBulkQuote]);

  const [createBooking, { isLoading: isCreatingSingle }] =
    useCreateBookingMutation();
  const [createBulkBooking, { isLoading: isCreatingBulk }] =
    useCreateBulkBookingMutation();

  const isCreating = isCreatingSingle || isCreatingBulk;
  const quote = isSingleMode ? singleQuote : bulkQuote;
  const hasInvalidCoupon =
    Boolean(appliedCouponCode) && quote?.couponValid === false;
  const canConfirm =
    !!quote &&
    quote.canPay &&
    !hasInvalidCoupon;
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
        await createBooking({
          timeSlotId,
          couponCode: appliedCouponCode || undefined,
        }).unwrap();
      } else if (isBulkMode) {
        await createBulkBooking({
          teacherId,
          timeSlotIds: bulkIds,
          couponCode: appliedCouponCode || undefined,
        }).unwrap();
      } else {
        return;
      }

      setShowSuccess(true);
    } catch (e: unknown) {
      setErrorMsg(extractApiErrorMessage(e, "Không thể xác nhận thanh toán."));
    }
  };

  const handleShowSuccess = () => {
    toast.success(t("booking.successTitle") || "Đặt lịch thành công!", {
      description: t("booking.successMessage") || "Bạn đã đặt lịch học thành công.",
      duration: 5000,
    });
  };

  const applyCoupon = () => {
    setErrorMsg("");
    setAppliedCouponCode(couponCode.trim().toUpperCase());
  };

  const selectCoupon = (coupon: UserCoupon) => {
    setErrorMsg("");
    const code = coupon.code.trim().toUpperCase();
    setCouponCode(code);
    setAppliedCouponCode(code);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCouponCode("");
  };

  const renderCouponPanel = () => {
    if (!quote) return null;

    return (
      <div className="rounded-xl border p-4 mt-4">
        <p className="mb-3 text-sm font-semibold">
          {t("monetization.messages.bookingDiscountTitle")}
        </p>
        {isFetchingCoupons && (
          <p className="mb-3 text-xs text-muted-foreground">
            {t("monetization.messages.loadingYourDiscountCodes")}
          </p>
        )}
        {bookingCoupons.length > 0 && (
          <div className="mb-4 grid gap-2">
            {bookingCoupons.map((coupon) => {
              const selected =
                appliedCouponCode === coupon.code.trim().toUpperCase();
              return (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => selectCoupon(coupon)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selected
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-bold">
                      <Ticket className="size-4 text-primary" />
                      {coupon.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCouponDiscount(coupon, t)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      {t("monetization.messages.remainingSingleUsage", {
                        remaining: coupon.usageRemaining,
                      })}
                    </span>
                    <span>{formatCouponExpiry(coupon, t)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            disabled={Boolean(appliedCouponCode)}
            placeholder={t("monetization.messages.enterDiscountCode")}
            className="min-h-11 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          {appliedCouponCode ? (
            <button
              type="button"
              onClick={removeCoupon}
              className="min-h-11 rounded-lg border px-4 text-sm font-bold hover:bg-muted transition-colors"
            >
              {t("monetization.actions.removeCode")}
            </button>
          ) : (
            <button
              type="button"
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {t("monetization.actions.applyCode")}
            </button>
          )}
        </div>
        {appliedCouponCode && quote.couponValid === false && (
          <p className="mt-2 text-xs text-destructive">{quote.couponMessage}</p>
        )}
        {appliedCouponCode && quote.couponValid && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            {t("monetization.messages.discountAppliedToTotal")}
          </p>
        )}
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 min-h-screen">
      {showSuccess && <SuccessModal router={router} onVisible={handleShowSuccess} />}

      <header className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-bold"
          >
            <div className="p-2.5 rounded-2xl border group-hover:border-primary/20 group-hover:bg-primary/10 transition-all">
              <ArrowLeft size={18} />
            </div>
          </button>
          <h2 className="text-2xl font-bold">{t('auto.booking_appointment_1')}</h2>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Xác nhận thanh toán
          </h1>
          <p className="text-muted-foreground">
            Kiểm tra thông tin đơn hàng trước khi đặt lịch.
          </p>
        </div>

        {!isSingleMode && !isBulkMode && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            Thiếu dữ liệu booking trên URL.
          </div>
        )}

        {(isLoading || isFetching || isBulkQuoteLoading) && (
          <div className="text-muted-foreground text-center animate-pulse">
            Đang tải thông tin đơn hàng...
          </div>
        )}

        {isQuoteError && !quote && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {quoteErrorMessage}
          </div>
        )}

        {!isLoading &&
          !isFetching &&
          !isBulkQuoteLoading &&
          !isQuoteError &&
          !quote && (
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300 text-center">
              Không có dữ liệu hóa đơn cho slot đã chọn. Vui lòng chọn lại lịch.
            </div>
          )}

        {quote && (
          <div className="border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold mb-5 border-b pb-4">
              Tóm tắt đơn hàng
            </h3>

            {"items" in quote ? (
              <div className="space-y-5">
                <div>
                  <p className="font-bold text-lg">
                    GV. {quote.teacherName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quote.slotCount} buổi đã chọn
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {quote.items.map((item) => (
                    <div
                      key={item.timeSlotId}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <p className="font-bold text-primary">{item.subject}</p>
                      <p className="text-muted-foreground mt-1">
                        {formatDate(item.startAt)} | {formatTimeRange(item.startAt, item.endAt)}
                      </p>
                      <p className="text-muted-foreground">
                        {item.durationMinutes} phút
                      </p>
                      <p className="mt-1">
                        {item.totalBlossom} 🌸
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('auto.booking_appointment_2')}</span>
                    <span>{quote.tuitionBlossom} 🌸</span>
                  </div>
                  {quote.serviceFeeBlossom > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('auto.booking_appointment_3')}</span>
                      <span>{quote.serviceFeeBlossom} 🌸</span>
                    </div>
                  )}
                  {(quote.discountBlossom ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm">
                      <span>{t("monetization.terms.discountCode")} {quote.couponCode}</span>
                      <span>-{quote.discountBlossom} 🌸</span>
                    </div>
                  )}
                  {quote.adminCommissionWaived && (quote.discountBlossom ?? 0) > 0 && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      {t("monetization.messages.bookingDiscountApplied")}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl pt-2">
                    <span>{t('auto.booking_appointment_4')}</span>
                    <span className="text-primary">
                      {quote.totalBlossom} 🌸
                    </span>
                  </div>
                </div>
                {renderCouponPanel()}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase text-primary mb-1">
                    Học phần: {quote.subject}
                  </p>
                  <p className="font-bold text-lg">
                    GV. {quote.teacherName}
                  </p>
                </div>

                <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-lg">
                  <p>{formatDate(quote.startAt)}</p>
                  <p className="text-muted-foreground">
                    {formatTimeRange(quote.startAt, quote.endAt)} ({quote.durationMinutes} phút)
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('auto.booking_appointment_5')}</span>
                    <span>{quote.tuitionBlossom} 🌸</span>
                  </div>
                  {quote.serviceFeeBlossom > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('auto.booking_appointment_6')}</span>
                      <span>{quote.serviceFeeBlossom} 🌸</span>
                    </div>
                  )}
                  {(quote.discountBlossom ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm">
                      <span>{t("monetization.terms.discountCode")} {quote.couponCode}</span>
                      <span>-{quote.discountBlossom} 🌸</span>
                    </div>
                  )}
                  {quote.adminCommissionWaived && (quote.discountBlossom ?? 0) > 0 && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      {t("monetization.messages.bookingDiscountApplied")}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl pt-2">
                    <span>{t('auto.booking_appointment_7')}</span>
                    <span className="text-primary">
                      {quote.totalBlossom} 🌸
                    </span>
                  </div>
                </div>

                {renderCouponPanel()}
              </div>
            )}

            {!quote.canPay && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mt-4">
                {quote.message}
              </div>
            )}

            {quote.canPay && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 mt-4">
                {t("monetization.messages.bookingHoldPolicy")}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mt-4">
                {errorMsg}
              </div>
            )}

            <button
              onClick={onConfirm}
              disabled={!canConfirm || isCreating}
              className="w-full mt-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl shadow-lg shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isCreating ? t("common.processing") : t("monetization.messages.confirmPayment")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          Đang tải trang thanh toán...
        </main>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}

function SuccessModal({
  router,
  onVisible,
}: {
  router: { push: (path: string) => void };
  onVisible: () => void;
}) {
  const { t } = useTranslation();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onVisible();
    }
  }, [onVisible]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-background border rounded-xl p-8 flex flex-col items-center text-center shadow-xl">
        <div className="size-16 rounded-full border-4 border-primary flex items-center justify-center text-primary mb-5">
          <Check className="h-8 w-8" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold mb-3">
          Thanh toán thành công!
        </h1>
        <p className="text-muted-foreground mb-6">{t('auto.booking_appointment_8')}</p>
        <button
          onClick={() => router.push("/booking/bookingmodal")}
          className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl transition-opacity"
        >
          Xem lịch của tôi
        </button>
      </div>
    </div>
  );
}
