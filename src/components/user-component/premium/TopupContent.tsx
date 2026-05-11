"use client";

import { useTranslation } from "react-i18next";
import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import PaymentStatus from "./PaymentStatus";
import TopupPackageCard from "./TopupPackageCard";
import { PaymentSocketProvider } from "@/providers/PaymentSocketProvider";
import { cn } from "@/lib/utils";
import { getTopupTransferAmountVnd, VND_PER_FLOWER } from "@/lib/topup";
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

  const locale = "vi-VN";
  const selectedTransferAmountVnd = selectedPkg
    ? getTopupTransferAmountVnd(selectedPkg.price)
    : 0;
  const selectedReceiveFlowers = selectedPkg
    ? selectedPkg.flowers + selectedPkg.bonusFlowers
    : 0;

  const paymentMethods = [
    {
      id: "bank",
      name: t("premium.topup.bank"),
      description: t("premium.topup.secureVietQr"),
      icon: <Landmark className="size-5 text-secondary" />,
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

      const bankId = orderData.bankId?.trim();
      const accountNo = orderData.accountNo?.trim();
      const accountName = orderData.accountName?.trim();
      const topupAmount = toFiniteNumber(orderData.amount, selectedPkg.flowers);
      const transferAmountVnd =
        toFiniteNumber(
          orderData.transferAmountVnd,
          getTopupTransferAmountVnd(selectedPkg.price),
        );

      if (!bankId || !accountNo || !accountName) {
        console.error("[payment] createPayment missing account data", {
          orderId: orderData.orderId,
          amount: topupAmount,
          transferAmountVnd,
          missingBankId: !bankId,
          missingAccountNo: !accountNo,
          missingAccountName: !accountName,
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
    <div className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-foreground">
                {t("premium.topup.choosePackage")}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {t("premium.topup.subtitle")}
              </p>
            </div>
            {isFetchingPackages && !isLoadingPackages && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading")}
              </div>
            )}
          </div>

          {isLoadingPackages ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="min-h-[210px] animate-pulse rounded-2xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground">
              {t("common.noResults")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        </section>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">
                  {t("premium.topup.currentBalance")}
                </p>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {availableBalance.toLocaleString(locale)}
                  </span>
                  <span className="text-xl">🌸</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {(availableBalance * VND_PER_FLOWER).toLocaleString(locale)}đ
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs font-bold text-secondary">
              {t("premium.topup.rateLine")}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <QrCode className="size-5" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">
                  {t("premium.topup.checkoutTitle")}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("premium.topup.secureVietQr")}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-muted-foreground">
                  {t("premium.topup.selectedPackage")}
                </span>
                <strong className="text-foreground">
                  {selectedPkg
                    ? `${selectedPkg.flowers.toLocaleString(locale)} 🌸`
                    : t("premium.topup.noPackageSelected")}
                </strong>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-muted-foreground">
                  {t("premium.topup.totalReceive")}
                </span>
                <strong className="text-secondary">
                  {selectedReceiveFlowers.toLocaleString(locale)} 🌸
                </strong>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-muted-foreground">
                  {t("premium.topup.transferAmount")}
                </span>
                <strong className="text-foreground">
                  {selectedTransferAmountVnd.toLocaleString(locale)}đ
                </strong>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleTopupClick}
              disabled={isCreatingPayment || !selectedPkg}
              className="mt-4 h-11 w-full rounded-xl font-black"
            >
              {isCreatingPayment ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("premium.topup.creatingOrder")}
                </>
              ) : (
                <>
                  {t("premium.topup.payWithQR")}
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <Banknote className="size-5" />
              </div>
              <h3 className="text-base font-black text-foreground">
                {t("premium.topup.paymentMethod")}
              </h3>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    selectedPayment === method.id
                      ? "border-secondary bg-secondary/5 ring-2 ring-secondary/15"
                      : "border-border hover:border-secondary/45",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background">
                    {method.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-foreground">
                      {method.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                      {method.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary" />
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                {t("premium.topup.autoMatchDesc")}
              </p>
            </div>
          </div>
        </aside>
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
