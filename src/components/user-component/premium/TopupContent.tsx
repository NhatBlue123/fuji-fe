"use client";

import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Banknote } from "lucide-react";
import { toast } from "sonner";

import PaymentStatus from "./PaymentStatus";
import TopupPackageCard from "./TopupPackageCard";
import { PaymentSocketProvider } from "@/providers/PaymentSocketProvider";
import { useCreatePaymentMutation } from "@/store/services/paymentApi";
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

function TopupContentInner() {
  const { t } = useTranslation();
  const { data: wallet } = useGetWalletQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [createPayment, { isLoading }] = useCreatePaymentMutation();

  const availableBalance = wallet?.balance || 0;
  const [selectedPackage, setSelectedPackage] = useState<number>(4);
  const [selectedPayment, setSelectedPayment] = useState<string>("bank");
  const [paymentQrData, setPaymentQrData] = useState<PaymentQrData | null>(null);

  const packages = [
    { id: 1, price: 10, flowers: 10 },
    { id: 2, price: 20, flowers: 20 },
    { id: 3, price: 50, flowers: 50, bonus: 5 },
    { id: 4, price: 100, flowers: 100, bonus: 20, isPopular: true },
    { id: 5, price: 200, flowers: 200, bonus: 60 },
    { id: 6, price: 500, flowers: 500, bonus: 100 },
  ];

  const paymentMethods = [
    {
      id: "bank",
      name: t("premium.topup.bank"),
      icon: <Banknote className="w-5 h-5 text-secondary" />,
    },
  ];

  const handleTopupClick = async () => {
    const selectedPkg = packages.find((pkg) => pkg.id === selectedPackage);
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
        toast.error(t("premium.topup.noBankAccount"));
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
        <h3 className="text-xl font-bold mb-6">{t("premium.topup.choosePackage")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <TopupPackageCard
              key={pkg.id}
              {...pkg}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </div>
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
          disabled={isLoading}
          className="px-12 py-4 bg-secondary text-secondary-foreground font-bold rounded-xl disabled:opacity-50"
        >
          {isLoading ? t("premium.topup.creatingOrder") : t("premium.topup.payWithQR")}
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
