"use client";

import { useTranslation } from "react-i18next";
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

type PaymentQrData = {
  orderId: string;
  amount: number;
  transferAmountVnd: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  createdAt: number;
};

const toFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function TopupContentInner() {
  const { t } = useTranslation();
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

  const availableBalance = wallet?.availableBalance ?? wallet?.balance ?? 0;
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

  const paymentMethods = [
    {
      id: "bank",
      name: t("premium.topup.bank"),
      icon: <Banknote className="w-5 h-5 text-secondary" />,
    },
  ];

  const handleTopupClick = async () => {
    if (!selectedPkg) {
      toast.error(t("premium.topup.selectPackage"));
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

      if (!orderData.orderId) {
        console.error("[payment] createPayment missing order id", orderData);
        toast.error(t("premium.topup.createFailed"));
        return;
      }

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
      const topupAmount = toFiniteNumber(orderData.amount, selectedPkg.flowers);
      const transferAmountVnd =
        toFiniteNumber(orderData.transferAmountVnd, selectedPkg.price);

      if (!accountNo) {
        console.error("[payment] createPayment missing account data", {
          orderId: orderData.orderId,
          amount: topupAmount,
          transferAmountVnd,
          bankId,
          missingAccountNo: !orderData.accountNo,
          missingAccountName: !orderData.accountName,
        });
        toast.error(t("premium.topup.noBankAccount"));
        return;
      }

      setPaymentQrData({
        orderId: orderData.orderId,
        amount: topupAmount,
        transferAmountVnd,
        bankId,
        accountNo,
        accountName,
        createdAt: createStartedAt,
      });

      toast.info(t("premium.topup.scanQR"));
    } catch (err) {
      console.error("[payment] createPayment failed", err);
      toast.error(t("premium.topup.createFailed"));
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <div className="text-sm font-bold text-muted-foreground uppercase">
            {t("premium.topup.currentBalance")}
          </div>
          <div className="flex items-center text-2xl font-bold gap-2">
            <span>{availableBalance.toLocaleString("vi-VN")}</span>
            <span className="text-3xl ml-1">🌸</span>
            <span className="text-xs text-muted-foreground">
              (~ {(availableBalance * 1000).toLocaleString("vi-VN")}đ)
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{t("premium.topup.choosePackage")}</h3>
          {isFetchingPackages && !isLoadingPackages && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </div>
          )}
        </div>

        {isLoadingPackages ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("common.loading")}
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
            {t("common.noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <h3 className="text-xl font-bold mb-6">{t("premium.topup.paymentMethod")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`flex items-center space-x-4 p-5 rounded-2xl border transition ${
                selectedPayment === method.id
                  ? "border-secondary border-2"
                  : "border-border hover:border-secondary/50"
              }`}
            >
              {method.icon}
              <span className="font-semibold">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleTopupClick}
          disabled={isCreatingPayment || !selectedPkg}
          className="px-12 py-4 bg-secondary text-secondary-foreground font-bold rounded-xl disabled:opacity-50"
        >
          {isCreatingPayment ? t("premium.topup.creatingOrder") : t("premium.topup.payWithQR")}
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
