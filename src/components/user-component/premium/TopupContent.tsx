"use client";

import React, { useMemo, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import PaymentStatus from "./PaymentStatus";
import TopupPackageCard from "./TopupPackageCard";
import { PaymentSocketProvider } from "@/providers/PaymentSocketProvider";
import { useCreatePaymentMutation } from "@/store/services/paymentApi";
import {
  type TopupPackage,
  useGetTopupPackagesQuery,
} from "@/store/services/topupPackageApi";
import { useGetWalletQuery } from "@/store/services/walletApi";

const paymentMethods = [
  {
    id: "bank",
    name: "Ngân hàng",
    icon: <Banknote className="h-5 w-5 text-secondary" />,
  },
];

type PaymentQrData = {
  orderId: string;
  amount: number;
  transferAmountVnd: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  createdAt: number;
};

function TopupContentInner() {
  const { data: wallet } = useGetWalletQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [createPayment, { isLoading: isCreatingPayment }] =
    useCreatePaymentMutation();
  const {
    data: topupPackages = [],
    isLoading: isLoadingPackages,
    isFetching: isFetchingPackages,
  } = useGetTopupPackagesQuery();

  const availableBalance = wallet?.availableBalance || 0;
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("bank");
  const [paymentQrData, setPaymentQrData] = useState<PaymentQrData | null>(null);

  const packages = useMemo(
    () =>
      [...topupPackages].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.id - b.id,
      ),
    [topupPackages],
  );

  const selectedPkg = useMemo<TopupPackage | null>(() => {
    if (!packages.length) return null;

    if (selectedPackageId != null) {
      const matched = packages.find((pkg) => pkg.id === selectedPackageId);
      if (matched) return matched;
    }

    return packages.find((pkg) => pkg.isPopular) || packages[0] || null;
  }, [packages, selectedPackageId]);

  const handleTopupClick = async () => {
    if (!selectedPkg) {
      toast.error("Vui lòng chọn gói nạp");
      return;
    }

    const createStartedAt = Date.now();
    console.info("[payment] createPayment requested", {
      amount: selectedPkg.price,
      requestedAt: new Date(createStartedAt).toISOString(),
    });

    try {
      const orderData = await createPayment({
        amount: selectedPkg.price,
      }).unwrap();

      console.info("[payment] createPayment succeeded", {
        orderId: orderData.orderId,
        requestedAt: new Date(createStartedAt).toISOString(),
        respondedAt: new Date().toISOString(),
      });

      const bankId =
        orderData.bankId || process.env.NEXT_PUBLIC_BANK_ID || "MB";
      const accountNo =
        orderData.accountNo ||
        process.env.NEXT_PUBLIC_ACCOUNT_NO ||
        "9316767481284";
      const accountName =
        orderData.accountName ||
        process.env.NEXT_PUBLIC_ACCOUNT_NAME ||
        "Duong Luong";
      const transferAmountVnd =
        orderData.transferAmountVnd ?? orderData.amount * 1000;

      if (!accountNo) {
        console.error("[payment] createPayment missing account data", {
          orderId: orderData.orderId,
          amount: orderData.amount,
          transferAmountVnd,
          bankId,
          missingAccountNo: !orderData.accountNo,
          missingAccountName: !orderData.accountName,
        });
        toast.error("Backend chua cau hinh tai khoan nhan tien");
        return;
      }

      setPaymentQrData({
        orderId: orderData.orderId,
        amount: orderData.amount,
        transferAmountVnd,
        bankId,
        accountNo,
        accountName,
        createdAt: createStartedAt,
      });

      toast.info("Vui lòng quét mã QR để thanh toán");
    } catch (err) {
      console.error("[payment] createPayment failed", err);
      toast.error("Không thể tạo đơn thanh toán");
    }
  };

  return (
    <div className="space-y-12 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-border dark:bg-card dark:shadow-none">
        <div className="flex items-center gap-x-2">
          <div className="text-sm font-bold uppercase text-slate-600 dark:text-muted-foreground">
            Số dư hiện tại:
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <span>{availableBalance.toLocaleString("vi-VN")}</span>
            <span className="ml-1 text-3xl">🌸</span>
            <span className="text-xs text-slate-500 dark:text-muted-foreground">
              (~ {(availableBalance * 1000).toLocaleString("vi-VN")}d)
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Chọn gói nạp</h3>
          {isFetchingPackages && !isLoadingPackages && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đồng bộ gói nạp...
            </div>
          )}
        </div>

        {isLoadingPackages ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-slate-500 dark:border-border dark:bg-card/40 dark:text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải gói nạp...
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500 dark:border-border dark:bg-card/40 dark:text-muted-foreground">
            Hiện tại chưa có gói nạp nào đang hoạt động.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <TopupPackageCard
                key={pkg.id}
                price={pkg.price}
                flowers={pkg.flowers}
                bonusFlowers={pkg.bonusFlowers}
                isPopular={pkg.isPopular}
                isSelected={selectedPkg?.id === pkg.id}
                onSelect={() => setSelectedPackageId(pkg.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-6 text-xl font-bold">Phương thức thanh toán</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`flex items-center space-x-4 rounded-2xl border p-5 transition ${
                selectedPayment === method.id
                  ? "border-secondary border-2 bg-white dark:bg-transparent"
                  : "border-slate-200 bg-white/90 hover:border-secondary/50 dark:border-border dark:bg-transparent"
              }`}
            >
              {method.icon}
              <span className="font-semibold">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPkg && (
        <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-4 text-sm text-slate-700 dark:border-secondary/30 dark:bg-secondary/10 dark:text-slate-200">
          <span className="font-semibold">Gói đang chọn:</span>{" "}
          {selectedPkg.flowers.toLocaleString("vi-VN")} hoa
          {selectedPkg.bonusFlowers > 0 && (
            <span>
              {" "}+ {selectedPkg.bonusFlowers.toLocaleString("vi-VN")} bonus
            </span>
          )}
          <span>
            {" "}• Chuyển khoản {selectedPkg.price.toLocaleString("vi-VN")}d
          </span>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleTopupClick}
          disabled={isCreatingPayment || !selectedPkg}
          className="rounded-xl bg-pink-500 px-12 py-4 font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)] disabled:opacity-50 dark:bg-secondary dark:text-secondary-foreground dark:shadow-none"
        >
          {isCreatingPayment ? "Đang tạo đơn..." : "Nạp ngay bằng VietQR"}
        </button>
      </div>

      {paymentQrData && (
        <PaymentStatus
          orderId={paymentQrData.orderId}
          amount={paymentQrData.amount}
          transferAmountVnd={paymentQrData.transferAmountVnd}
          bankId={paymentQrData.bankId}
          accountNo={paymentQrData.accountNo}
          accountName={paymentQrData.accountName}
          createdAt={paymentQrData.createdAt}
          onClose={() => setPaymentQrData(null)}
        />
      )}
    </div>
  );
}

export default function TopupContent() {
  return (
    <PaymentSocketProvider>
      <TopupContentInner />
    </PaymentSocketProvider>
  );
}
